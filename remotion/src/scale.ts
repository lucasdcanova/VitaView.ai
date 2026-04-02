// Font scale factors — all fontSize values go through this
// Vertical needs much bigger text, horizontal slightly bigger

export const fs = (base: number, v: boolean) =>
  v ? Math.round(base * 1.45) : Math.round(base * 1.18);
