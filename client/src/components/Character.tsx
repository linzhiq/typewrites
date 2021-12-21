import React, { useEffect, useState } from "react";
import {
  CursorsForCell,
  registerSetCursorsDispatch,
  SetUserCursorPosition,
} from "../managers/cursors";

// use string instead of array to allow shallow comparison with React.memo
export type CharacterContent = string;

type CharacterProps = {
  lineIdx: number;
  columnIdx: number;
  content: CharacterContent;
  setUserCursorPosition: SetUserCursorPosition;
};

export const Character = React.memo<CharacterProps>(
  ({ content, lineIdx, columnIdx, setUserCursorPosition }) => {
    const [cursors, setCursors] = useState<CursorsForCell>({ self: false });

    useEffect(() => {
      registerSetCursorsDispatch(setCursors, {
        line: lineIdx,
        column: columnIdx,
      });
    }, [setCursors]);

    return (
      <div
        key={`${columnIdx}`}
        className="character"
        style={{
          backgroundColor: (cursors.self && "black") || undefined,
          color: (cursors.self && "white") || undefined,
        }}
        onClick={() => {
          setUserCursorPosition({ line: lineIdx, column: columnIdx });
        }}
      >
        {[...content].map((char, idx) => {
          return (
            <div
              className="revision"
              style={{ opacity: 1 - (content.length - 1 - idx) / 5 }}
            >
              {char}
            </div>
          );
        })}
      </div>
    );
  }
);
