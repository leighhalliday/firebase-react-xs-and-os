import { firebase } from "src/initFirebase";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

const db = firebase.database();
interface IProps {
  id: string;
}

type IRow = [string, string, string];

interface IGame {
  player1: string;
  player2: string;
  first: string;
  turn: string;
  board: [IRow, IRow, IRow];
}

function checkWinner(game: IGame): boolean {
  const board = game.board;

  const byRow = () =>
    [0, 1, 2].some(
      (i) =>
        board[i][0] !== "" &&
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2]
    );

  const byCol = () =>
    [0, 1, 2].some(
      (i) =>
        board[0][i] !== "" &&
        board[0][i] === board[1][i] &&
        board[1][i] === board[2][i]
    );

  const diag1 = () =>
    board[0][0] !== "" &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2];

  const diag2 = () =>
    board[0][2] !== "" &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0];

  return byRow() || byCol() || diag1() || diag2();
}

// [
//   ["0-0", "0-1", "0-2"],
//   ["1-0", "1-1", "1-2"],
//   ["2-0", "2-1", "2-2"],
// ];

export default function Game({ id }: IProps) {
  const [game, setGame] = useState<IGame | null>(null);
  const winner = !!game && checkWinner(game);

  useEffect(() => {
    const ref = db.ref(`games/${id}`);

    ref.on("value", (snapshot) => {
      setGame(snapshot.val());
    });

    return () => ref.off();
  }, [id]);

  const saveMove = (rowIndex: number, colIndex: number) => {
    if (!game) {
      return;
    }
    const copy = { ...game };
    copy.board[rowIndex][colIndex] = game.turn === game.first ? "X" : "O";
    copy.turn = copy.turn === "player1" ? "player2" : "player1";
    db.ref(`games/${id}`).set(copy);
  };

  if (!game) return <div>Loading Game</div>;

  return (
    <main>
      {winner ? (
        <h1>
          {game.turn === "player1" ? game.player2 : game.player1} Is The Champ!
        </h1>
      ) : (
        <h1>{game.turn === "player1" ? game.player1 : game.player2}'s Turn</h1>
      )}

      <div className="board">
        {game.board.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="row">
            {row.map((col, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="square"
                onClick={() => {
                  if (col === "" && !winner) {
                    saveMove(rowIndex, colIndex);
                  }
                }}
              >
                {col}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const copy = { ...game };
          copy.first = copy.first === "player1" ? "player2" : "player1";
          copy.turn = copy.first;
          copy.board = [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
          ];
          db.ref(`games/${id}`).set(copy);
        }}
      >
        Reset
      </button>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  return { props: { id: query.id } };
};
