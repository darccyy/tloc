function sin(x) {
  return Math.min(
    1,
    Math.floor(
      mod(
        2 * x / Math.PI - 1, 4
      ) / 2
    )
  ) * (
      Math.floor(
        mod(
          2 * x / Math.PI, 2
        )
      ) * (
        Math.floor(
          2 * x / Math.PI
        ) - 2 * x / Math.PI
      ) ** 2 + Math.floor(
        mod(
          2 * x / Math.PI + 1, 2
        )
      ) * (
        2 - (
          Math.floor(
            -2 * x / Math.PI
          ) + 2 * x / Math.PI
        ) ** 2
      )
    ) + Math.min(
      1, Math.floor(
        mod(
          2 * x / Math.PI + 1, 4
        ) / 2
      )
    ) * (
      Math.floor(
        mod(
          -2 * x / Math.PI, 2
        )
      ) * (
        Math.floor(
          -2 * x / Math.PI
        ) + 2 * x / Math.PI
      ) ** 2 + Math.floor(
        mod(
          -2 * x / Math.PI + 1, 2
        )
      ) * (
        2 - (
          Math.floor(
            2 * x / Math.PI
          ) - 2 * x / Math.PI
        ) ** 2
      )
    ) - 1;
}

function mod(a, b) {
  return a - b * Math.floor(a / b);
}

for (i = 0; i < 10; i++) {
  console.table({
    Real: Math.round(Math.sin(i) * 100) / 100,
    Approx: Math.round(sin(i) * 100) / 100,
    Difference: Math.abs(Math.round((sin(i) - Math.sin(i)) * 100) / 100),
  });
}