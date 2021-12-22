import React, { useEffect, useState } from "react";
import {
  CursorsForCell,
  registerSetCursorsDispatch, setUserCursorPosition,
  SetUserCursorPosition, unregisterSetCursorsDispatch
} from "../managers/cursors";
import { CharacterContent } from "../managers/documents";

type CharacterProps = {
  lineIdx: number;
  columnIdx: number;
  content: CharacterContent;
};

export const Character = React.memo<CharacterProps>(
  ({ content, lineIdx, columnIdx }) => {
    const [cursors, setCursors] = useState<CursorsForCell>({ self: false });

    useEffect(() => {
      const position = {
        line: lineIdx,
        column: columnIdx,
      };

      registerSetCursorsDispatch(setCursors, position);

      return () => {
        unregisterSetCursorsDispatch(position);
      }
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
