import React, { useEffect, useState } from "react";
import {
  cursorColorIdForPlayerId,
  CursorsForCell,
  registerSetCursorsDispatch,
  setUserCursorPosition,
  SetUserCursorPosition,
  unregisterSetCursorsDispatch
} from "../managers/cursors";
import { CharacterContent } from "../managers/documents";
import { Cursor } from "./Cursor";

type CharacterProps = {
  lineIdx: number;
  columnIdx: number;
  content: CharacterContent;
};

export const Character = React.memo<CharacterProps>(
  ({ content, lineIdx, columnIdx }) => {
    const [cursors, setCursors] = useState<CursorsForCell>({ self: false });
    const cursorColorIds = [
      ...cursors.self? [0]: [],
      ...cursors.players? [...cursors.players].map((playerId) => cursorColorIdForPlayerId(playerId)): []
    ];

    useEffect(() => {
      const position = {
        line: lineIdx,
        column: columnIdx,
      };

      registerSetCursorsDispatch(setCursors, position);

      return () => {
        unregisterSetCursorsDispatch(position);
      };
    }, [setCursors]);

    return (
      <div
        key={`${columnIdx}`}
        className="character"
        style={{ position: "relative" }}
        onClick={() => {
          setUserCursorPosition({ line: lineIdx, column: columnIdx });
        }}
      >
        {[...content].map((char, idx) => (
          <div
            className="revision"
            style={{ opacity: 1 - (content.length - 1 - idx) / 5 }}
          >
            {char}
          </div>
        ))}
        {cursorColorIds.map((colorId, index) => (
          <Cursor
            index={index}
            count={cursorColorIds.length}
            colorId={colorId}
          />
        ))}
      </div>
    );
  }
);
