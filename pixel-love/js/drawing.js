/* Pixel Love — canvas pixel sprites. imageSmoothing off; crisp edges. */
const Sprites = (() => {
  const PX = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const clear = ctx => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const P = {
    skin: '#f4c2a1', hairBoy: '#5a3b2a', hairGirl: '#8a5a3b',
    eye: '#2a1f2d', blush: '#ff9eb5', cheek: '#ffd1dc',
    shirt: '#6ba3d0', shirtD: '#4a7ba0', pants: '#3f3f5a',
    dress: '#e85d8a', dressD: '#c9456e', shoe: '#3a2b3f'
  };

  const state = { boyPose: 'idle', girlPose: 'idle', boyBlink: false, girlBlink: false, boyHasFlower: false };

  function eye(ctx, x, y, blink) {
    if (blink) { PX(ctx, x, y + 1, 2, 1, P.eye); return; }
    PX(ctx, x, y, 2, 2, P.eye);
    PX(ctx, x, y, 1, 1, '#ffffff');
  }

  function drawBoy(ctx, pose = state.boyPose) {
    clear(ctx);
    PX(ctx, 3, 0, 8, 1, P.hairBoy); PX(ctx, 2, 1, 10, 1, P.hairBoy);
    PX(ctx, 1, 2, 12, 2, P.hairBoy); PX(ctx, 2, 4, 10, 1, P.hairBoy);
    PX(ctx, 2, 4, 10, 7, P.skin);
    eye(ctx, 4, 6, state.boyBlink); eye(ctx, 8, 6, state.boyBlink);
    PX(ctx, 2, 8, 2, 1, P.blush); PX(ctx, 10, 8, 2, 1, P.blush);
    if (pose === 'smile') { PX(ctx, 5, 9, 4, 1, P.eye); PX(ctx, 5, 9, 4, 1, '#c9456e'); }
    else if (pose === 'surprised') { PX(ctx, 6, 9, 2, 3, P.eye); PX(ctx, 6, 9, 1, 1, '#ffffff'); }
    else PX(ctx, 6, 10, 2, 1, P.eye);
    PX(ctx, 6, 11, 2, 1, P.skin);
    PX(ctx, 2, 12, 10, 4, P.shirt);
    PX(ctx, 1, 13, 2, 3, P.shirtD); PX(ctx, 11, 13, 2, 3, P.shirtD);
    PX(ctx, 3, 16, 3, 2, P.pants); PX(ctx, 8, 16, 3, 2, P.pants);
    PX(ctx, 3, 18, 3, 1, P.shoe); PX(ctx, 8, 18, 3, 1, P.shoe);
    if (state.boyHasFlower) {
      PX(ctx, 11, 14, 1, 2, '#ffffff');
      PX(ctx, 12, 13, 2, 2, '#ff8fa3'); PX(ctx, 13, 12, 1, 1, '#ffe066');
    }
  }

  function drawGirl(ctx, pose = state.girlPose) {
    clear(ctx);
    PX(ctx, 3, 0, 8, 1, P.hairGirl); PX(ctx, 2, 1, 10, 1, P.hairGirl);
    PX(ctx, 1, 2, 12, 2, P.hairGirl); PX(ctx, 1, 4, 12, 4, P.hairGirl);
    PX(ctx, 1, 8, 2, 3, P.hairGirl); PX(ctx, 11, 8, 2, 3, P.hairGirl);
    PX(ctx, 3, 4, 8, 6, P.skin);
    PX(ctx, 3, 2, 8, 2, P.hairGirl); PX(ctx, 2, 3, 2, 2, P.hairGirl); PX(ctx, 10, 3, 2, 2, P.hairGirl);
    eye(ctx, 5, 6, state.girlBlink); eye(ctx, 9, 6, state.girlBlink);
    PX(ctx, 4, 8, 2, 1, P.cheek); PX(ctx, 9, 8, 2, 1, P.cheek);
    if (pose === 'smile' || pose === 'accept') { PX(ctx, 6, 9, 4, 1, '#3a2b3f'); PX(ctx, 6, 9, 4, 1, '#c9456e'); }
    else if (pose === 'shock') { PX(ctx, 6, 9, 2, 2, P.eye); }
    else PX(ctx, 6, 10, 2, 1, P.eye);
    PX(ctx, 5, 10, 4, 2, P.skin);
    PX(ctx, 2, 12, 10, 2, P.dress);
    PX(ctx, 1, 14, 12, 2, P.dress);
    PX(ctx, 0, 16, 14, 2, P.dressD);
    PX(ctx, 4, 18, 2, 1, P.shoe); PX(ctx, 8, 18, 2, 1, P.shoe);
    if (pose === 'accept') { PX(ctx, 11, 14, 1, 1, '#ffffff'); PX(ctx, 12, 13, 2, 2, '#ff8fa3'); PX(ctx, 12, 12, 1, 1, '#ffe066'); }
  }

  function drawFlower(ctx) {
    clear(ctx);
    PX(ctx, 3, 5, 2, 3, '#5ea85e');
    PX(ctx, 2, 4, 1, 1, '#5ea85e'); PX(ctx, 5, 4, 1, 1, '#5ea85e');
    PX(ctx, 1, 2, 2, 2, '#ff8fa3'); PX(ctx, 5, 2, 2, 2, '#ff8fa3');
    PX(ctx, 1, 0, 2, 2, '#e85d8a'); PX(ctx, 5, 0, 2, 2, '#e85d8a');
    PX(ctx, 3, 1, 2, 2, '#e85d8a'); PX(ctx, 3, 1, 2, 2, '#ffe066');
  }

  function drawHeart(ctx) {
    clear(ctx);
    const grid = ['0110110','1111111','1111111','0111110','0011100','0001000'];
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++)
        if (grid[y][x] === '1') PX(ctx, x, y, 1, 1, y === 0 ? '#ff8fa3' : '#e85d8a');
  }

  return { state, drawBoy, drawGirl, drawFlower, drawHeart };
})();
