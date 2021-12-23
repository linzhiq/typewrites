import React from "react";

export type CursorProps = {
  index: number, // index of the cursor on the cell
  count: number, // number of cursors on the cell
  colorId: number; // 0 is reserved for current user
};

const USER_CURSOR_COLOR = "#1F2329";
const PLAYER_CURSOR_COLORS = [
  "#F56F66",
  "#A6CC7A",
  "#7FE0FF",
  "#F8CD5E",
  "#A3A3F5",
];

const CURSOR_SPACING = 6;

export const Cursor: React.FC<CursorProps> = ({ colorId, index, count }) => {
  return (
    <div style={{position: "absolute", left: index * CURSOR_SPACING - 4, bottom: -8 }}>
      <svg
        width="8"
        height="7"
        viewBox="0 0 8 7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.13397 0.500001C3.51887 -0.166666 4.48113 -0.166667 4.86603 0.5L7.4641 5C7.849 5.66667 7.36788 6.5 6.59808 6.5H1.40192C0.632124 6.5 0.150998 5.66667 0.535898 5L3.13397 0.500001Z"
          fill={
            colorId === 0
              ? USER_CURSOR_COLOR
              : PLAYER_CURSOR_COLORS[(colorId % PLAYER_CURSOR_COLORS.length) - 1]
          }
          fillOpacity="0.8"
        />
      </svg>
    </div>
  );
};
