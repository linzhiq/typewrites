import { useEffect } from "react";
import {
  CursorManagerMethods,
  setUserCursorPosition,
  userCursorPosition,
} from "./cursors";
import { addCurrentLine, CHAR_PER_LINE, contentAtLine, lineCount, setCurrentCharacter } from "./documents";

const moveCursor = (
  direction: "left" | "right" | "up" | "down",
  instruction: "jumpOne" | "jumpWord" | "jumpLine",
  createNewLine?: boolean
) => {
  if (
    instruction === "jumpLine" &&
    (direction === "left" || direction === "right")
  ) {
    setUserCursorPosition({
      line: userCursorPosition.line,
      column: direction === "left" ? 0 : CHAR_PER_LINE - 1,
    });
  } else if (instruction === "jumpWord") {
    const content = contentAtLine.get(userCursorPosition.line);
    if (content) {
      let column = userCursorPosition.column;

      if (direction === "left") {
        while (
          column > 0 &&
          !!content[column].length ===
            !!content[userCursorPosition.column].length
        ) {
          column--;
        }
      } else if (direction === "right") {
        while (
          column < CHAR_PER_LINE - 1 &&
          !!content[column].length ===
            !!content[userCursorPosition.column].length
        ) {
          column++;
        }
      }

      setUserCursorPosition({
        line: userCursorPosition.line,
        column,
      });
    }
  } else if (instruction === "jumpOne") {
    switch (direction) {
      case "left":
        if (userCursorPosition.column === 0) {
          setUserCursorPosition({
            line: Math.max(0, userCursorPosition.line - 1),
            column: CHAR_PER_LINE - 1,
          });
        } else {
          setUserCursorPosition({
            line: userCursorPosition.line,
            column: userCursorPosition.column - 1,
          });
        }
        break;
      case "right":
        if (userCursorPosition.column === CHAR_PER_LINE - 1) {
          setUserCursorPosition({
            line: userCursorPosition.line + 1,
            column: 0,
          });
        } else {
          setUserCursorPosition({
            line: userCursorPosition.line,
            column: userCursorPosition.column + 1,
          });
        }
        break;
      case "up":
        setUserCursorPosition({
          line: Math.max(0, userCursorPosition.line - 1),
          column: userCursorPosition.column,
        });
        break;
      case "down":
        if (userCursorPosition.line + 1 === lineCount) {
          if (createNewLine) {
            setUserCursorPosition({
              line: userCursorPosition.line + 1,
              column: 0,
            });
            addCurrentLine();
          } else {
            // no-op
          }
        } else {
          setUserCursorPosition({
            line: userCursorPosition.line + 1,
            column: userCursorPosition.column,
          });
        }
        break;
    }
  }
};

const onKeyboardEvent = async (e: KeyboardEvent) => {
  const instruction =
    e.ctrlKey || e.metaKey ? "jumpLine" : e.altKey ? "jumpWord" : "jumpOne";

  switch (e.key) {
    case "ArrowLeft":
      moveCursor("left", instruction);
      e.preventDefault();
      break;
    case "ArrowRight":
      moveCursor("right", instruction);
      e.preventDefault();
      break;
    case "ArrowUp":
      moveCursor("up", instruction);
      e.preventDefault();
      break;
    case "ArrowDown":
      moveCursor("down", instruction);
      e.preventDefault();
      break;
    default:
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // no-op
        return;
      }
  }

  if (e.key === "Backspace") {
    moveCursor("left", "jumpOne");
  } if (e.key === 'Enter') {
    moveCursor("down", "jumpOne", true);
  } else if (e.key.length === 1) {
    // input is a character; update doc
    setCurrentCharacter(e.key);
    moveCursor("right", "jumpOne");
  }
};

export const useKeyboardManager: (
  cursorManagerMethods: CursorManagerMethods
) => void = ({ setUserCursorPosition }) => {
  useEffect(() => {
    window.addEventListener("keydown", onKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", onKeyboardEvent);
    };
  }, [setUserCursorPosition]);
};
