/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useSearchParams,
} from "react-router-dom";
import "./App.css";

export type Label = "X" | "O";

export interface Coord {
  row: number;
  col: number;
}

export interface Piece extends Coord {
  label: Label;
}

export interface CellProps extends Coord {
  style: React.CSSProperties; // TBD: must have gridArea
}

export interface PieceProps extends CellProps {
  label: Label;
}

export interface UseGameSetting {
  cellSize: number;
  gameSize: number;
}

export interface UseGame {
  label: React.MutableRefObject<Label>;
  cellSize: number;
  setCellSize: React.Dispatch<React.SetStateAction<number>>;
  gameSize: number;
  setGameSize: React.Dispatch<React.SetStateAction<number>>;
  pieces: Piece[];
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  winningPieces: Piece[];
  setWinningPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  cells: Coord[];
  dialog: React.RefObject<HTMLDialogElement>;
  closeDialog: () => void;
  openDialog: () => void;
}

export interface GameProviderProps extends React.PropsWithChildren {
  game: Partial<UseGame>;
}

export const CellCenterStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
};

export const getCellBorders = (props: {
  row: number;
  col: number;
  game: UseGame;
}): React.CSSProperties => {
  const { row, col, game } = props;
  const borderTop = row !== 0 ? "1px solid black" : undefined;
  const borderLeft = col !== 0 ? "1px solid black" : undefined;
  const borderBottom =
    row !== game.gameSize - 1 ? "1px solid black" : undefined;
  const borderRight = col !== game.gameSize - 1 ? "1px solid black" : undefined;

  return {
    borderTop,
    borderBottom,
    borderLeft,
    borderRight,
  };
};

export const Cell = (props: CellProps): React.ReactNode => {
  const { row, col } = props;
  const game = useGameFromContext();
  const borders = getCellBorders({ row, col, game });
  const size = `${game.cellSize}px`;
  const style: React.CSSProperties = {
    ...CellCenterStyle,
    ...borders,
    boxSizing: "border-box",
    width: size,
    height: size,
    ...props.style,
  };

  return (
    <div style={style} onClick={() => addPiece({ game, row, col })}>
      <>{/* {row},{col} */}</>
    </div>
  );
};

export const CircleStyle: React.CSSProperties = {
  ...CellCenterStyle,
  outline: "1px solid black",
  borderRadius: "50%",
};

export const CrossStyle: React.CSSProperties = {
  ...CellCenterStyle,
  background: `linear-gradient(to top left,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.8px),
             rgba(0,0,0,1) 50%,
             rgba(0,0,0,0) calc(50% + 0.8px),
             rgba(0,0,0,0) 100%),
         linear-gradient(to top right,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.8px),
             rgba(0,0,0,1) 50%,
             rgba(0,0,0,0) calc(50% + 0.8px),
             rgba(0,0,0,0) 100%)`,
};

export const PieceStyle = (props: {
  game: UseGame;
  label: Label;
}): React.CSSProperties => {
  const { label } = props;
  return label === "X" ? CrossStyle : CircleStyle;
};

export const getCellDimension = (game: UseGame): React.CSSProperties => {
  const size = `${game.cellSize - 30}px`;
  return {
    width: size,
    height: size,
  };
};

export const Piece = (props: PieceProps): React.ReactNode => {
  const { label } = props;
  const game = useGameFromContext();
  const style = {
    ...PieceStyle({ game, label }),
    ...getCellDimension(game),
    ...props.style,
  };

  return (
    <div style={style}>
      <>{/* {row},{col} */}</>
    </div>
  );
};

export const cellGridAreaRow = (row: number, length: number): string => {
  const cols = Array.from({ length })
    .map((_, i) => `C_${row}_${i}`)
    .join(" ");
  return `"${cols}"`;
};

export const cellGridArea = (n: number): string => {
  const area = Array.from({ length: n })
    .map((_, row) => cellGridAreaRow(row, n))
    .join(" ");
  return area;
};

export const CellBoardStyle = (
  n: number,
  size: number,
): React.CSSProperties => {
  const boardSize = `${n * size}px`;
  return {
    display: "grid",
    width: boardSize,
    height: boardSize,
    padding: "10px",
    placeItems: "center",
    gridTemplateAreas: cellGridArea(n),
  };
};

export const createCells = (gameSize: number): Coord[] => {
  const result: Coord[] = [];
  for (let row = 0; row < gameSize; row = row + 1) {
    for (let col = 0; col < gameSize; col = col + 1) {
      result.push({ row, col });
    }
  }
  return result;
};

export const useGameSetting = (): UseGameSetting => {
  const [params, setParams] = useSearchParams();
  const cellSize = params.get("cellSize");
  const gameSize = params.get("gameSize");

  useEffect(() => {
    if (cellSize != null && gameSize != null) {
      return;
    }

    setParams(
      new URLSearchParams({
        cellSize: cellSize ?? "120",
        gameSize: gameSize ?? "3",
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cellSize: Number(cellSize),
    gameSize: Number(gameSize),
  };
};

export const USE_GAME_DEFAULT: UseGame = {
  label: { current: "O" },
  cellSize: 0,
  setCellSize: () => {},
  gameSize: 0,
  setGameSize: () => {},
  cells: [],
  pieces: [],
  setPieces: () => {},
  winningPieces: [],
  setWinningPieces: () => {},
  dialog: { current: null },
  closeDialog: () => {},
  openDialog: () => {},
};

export const useGame = (
  props: Partial<UseGame> = USE_GAME_DEFAULT,
): UseGame => {
  const init = { ...USE_GAME_DEFAULT, ...props };
  const [cellSize, setCellSize] = useState<number>(init.cellSize);
  const [gameSize, setGameSize] = useState<number>(init.gameSize);
  const [pieces, setPieces] = useState<Piece[]>(init.pieces);
  const [winningPieces, setWinningPieces] = useState<Piece[]>(
    init.winningPieces,
  );
  const cells = useMemo<Coord[]>(() => createCells(gameSize), [gameSize]);

  const label = useRef<Label>(init.label.current);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeDialog = () => dialog.current?.close();
  const openDialog = () => dialog.current?.showModal();

  useEffect(() => {
    if (winningPieces.length === gameSize) {
      openDialog();
    }
  }, [winningPieces, gameSize, label]);

  return {
    label,
    cellSize,
    setCellSize,
    gameSize,
    setGameSize,
    cells,
    pieces,
    setPieces,
    winningPieces,
    setWinningPieces,
    dialog,
    openDialog,
    closeDialog,
  };
};

export const resetGame = (game: UseGame): void => {
  game.label.current = "O";
  game.setPieces([]);
  game.setWinningPieces([]);
  game.closeDialog();
};

export const addPiece = (props: {
  game: UseGame;
  row: number;
  col: number;
}) => {
  const { game, row, col } = props;
  const already = game.pieces.some((p) => p.row === row && p.col === col);
  if (already) {
    return;
  }

  if (game.winningPieces.length === game.gameSize) {
    game.openDialog();
    return;
  }

  const size = game.gameSize;
  const label = game.label.current;
  const newPiece: Piece = { row, col, label };
  const pieces = [...game.pieces, newPiece];
  const winningPieces = findWinningPieces({ pieces, size, label, row, col });
  game.label.current = label === "X" ? "O" : "X";
  game.setPieces(pieces);

  if (winningPieces.length === game.gameSize) {
    game.label.current = label;
    game.setWinningPieces(winningPieces);
  }
};

const winning = {
  row:
    (row: number) =>
    (piece: Piece): boolean =>
      piece.row === row,
  col:
    (col: number) =>
    (piece: Piece): boolean =>
      piece.col === col,
  fall: (piece: Piece): boolean => piece.col === piece.row,
  rise:
    (size: number) =>
    (piece: Piece): boolean =>
      piece.col + piece.row === size - 1,
};

export const getLabeledPieces = (pieces: Piece[], label: Label): Piece[] =>
  pieces.filter((piece) => piece.label === label);

export const findWinningPieces = (props: {
  pieces: Piece[];
  size: number;
  label: Label;
  row: number;
  col: number;
}): Piece[] => {
  const { size, label } = props;
  const pieces = getLabeledPieces(props.pieces, label);

  const row = pieces.filter(winning.row(props.row));
  const col = pieces.filter(winning.col(props.col));
  const fall = pieces.filter(winning.fall);
  const rise = pieces.filter(winning.rise(size));

  if (row.length === size) {
    return row;
  } else if (col.length === size) {
    return col;
  } else if (fall.length === size) {
    return fall;
  } else if (rise.length === size) {
    return rise;
  } else return [];
};

const GameContext = createContext<UseGame>(USE_GAME_DEFAULT);

const GameProvider = (props: GameProviderProps): React.ReactNode => {
  const { children, game } = props;
  const value = useGame(game);

  return (
    <GameContext.Provider value={value}>
      <>{children}</>
    </GameContext.Provider>
  );
};

export const useGameFromContext = () => useContext(GameContext);

export const makeCellCenterStyle = (props: { row: number; col: number }) => {
  const { row, col } = props;

  return {
    gridArea: `C_${row}_${col}`,
  };
};

export const GameCells = () => {
  const game = useGameFromContext();
  const { cells } = game;

  return (
    // <></> for gridArea
    <>
      {cells.map(({ row, col }) => (
        <Cell
          key={`${getGridAreaLabel({ row, col, label: "C" })}`}
          row={row}
          col={col}
          style={getGridArea({ row, col })}
        />
      ))}
    </>
  );
};

export const GameCellsMemo = memo(GameCells, () => false);

export const GamePieces = (props: { label: Label }) => {
  const { label } = props;
  const game = useGameFromContext();
  const labeledPieces = getLabeledPieces(game.pieces, label);

  return (
    // <></> for gridArea
    <>
      {labeledPieces.map(({ row, col }) => (
        <Piece
          key={`${getGridAreaLabel({ row, col, label })}`}
          style={getGridArea({ row, col })}
          label={label}
          row={row}
          col={col}
        />
      ))}
    </>
  );
};

const getGridAreaLabel = (props: {
  row: number;
  col: number;
  label?: string;
}): string => {
  const { row, col, label = "C" } = props;
  return `${label}_${row}_${col}`;
};

const getGridArea = (props: {
  row: number;
  col: number;
  label?: string;
}): React.CSSProperties => {
  return { gridArea: getGridAreaLabel(props) };
};

export const GameToastStyle = {
  dialog: {
    border: "none",
    padding: "40px",
    borderRadius: "10px",
  } as React.CSSProperties,
  buttons: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "1fr 1fr",
  } as React.CSSProperties,
};

export const GameToast = () => {
  const game = useGameFromContext();
  const { winningPieces, dialog, closeDialog } = game;
  const label = game.label.current;

  return (
    <dialog
      style={GameToastStyle.dialog}
      ref={dialog}
      onCancel={closeDialog}
      onClose={closeDialog}
    >
      <h1>
        Winner is <strong>{label}</strong>
      </h1>
      <div>
        {winningPieces.map((piece, i) => (
          <div key={i}>
            {piece.row}, {piece.col}
          </div>
        ))}
      </div>
      <div style={GameToastStyle.buttons}>
        <button onClick={() => resetGame(game)}>clear</button>
        <button onClick={() => closeDialog()}>close</button>
      </div>
    </dialog>
  );
};

export const GameBoard = (props: React.PropsWithChildren) => {
  const game = useGameFromContext();
  const { gameSize, cellSize } = game;

  return (
    <div style={CellBoardStyle(gameSize, cellSize)}>
      <>{props.children}</>
    </div>
  );
};

export const Game = () => {
  const game: Partial<UseGame> = useGameSetting();

  return (
    <GameProvider game={game}>
      <GameBoard>
        <GameCells />
        <GamePieces label="O" />
        <GamePieces label="X" />
        <GameToast />
      </GameBoard>
    </GameProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Game />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} fallbackElement={<div>...</div>} />;
};
