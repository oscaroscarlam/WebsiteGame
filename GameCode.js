//=========================================================================
// minimalist DOM helpers
//=========================================================================

var Dom = {

  get:  function(id)                     { return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id); },
  set:  function(id, html)               { Dom.get(id).innerHTML = html;                        },
  on:   function(ele, type, fn, capture) { Dom.get(ele).addEventListener(type, fn, capture);    },
  un:   function(ele, type, fn, capture) { Dom.get(ele).removeEventListener(type, fn, capture); },
  show: function(ele, type)              { Dom.get(ele).style.display = (type || 'block');      },
  blur: function(ev)                     { ev.target.blur();                                    },

  addClassName:    function(ele, name)     { Dom.toggleClassName(ele, name, true);  },
  removeClassName: function(ele, name)     { Dom.toggleClassName(ele, name, false); },
  toggleClassName: function(ele, name, on) {
    ele = Dom.get(ele);
    var classes = ele.className.split(' ');
    var n = classes.indexOf(name);
    on = (typeof on == 'undefined') ? (n < 0) : on;
    if (on && (n < 0))
      classes.push(name);
    else if (!on && (n >= 0))
      classes.splice(n, 1);
    ele.className = classes.join(' ');
  },

  storage: window.localStorage || {}

}

//=========================================================================
// general purpose helpers (mostly math)
//=========================================================================

var Util = {

  timestamp:        function()                  { return new Date().getTime();                                    },
  toInt:            function(obj, def)          { if (obj !== null) { var x = parseInt(obj, 10); if (!isNaN(x)) return x; } return Util.toInt(def, 0); },
  toFloat:          function(obj, def)          { if (obj !== null) { var x = parseFloat(obj);   if (!isNaN(x)) return x; } return Util.toFloat(def, 0.0); },
  limit:            function(value, min, max)   { return Math.max(min, Math.min(value, max));                     },
  randomInt:        function(min, max)          { return Math.round(Util.interpolate(min, max, Math.random()));   },
  randomChoiceInt:  function(options)           { return Util.randomInt(0, options.length-1)                      },
  randomChoice:     function(options)           { return options[Util.randomInt(0, options.length-1)];            },
  percentRemaining: function(n, total)          { return (n%total)/total;                                         },
  accelerate:       function(v, accel, dt)      { return v + (accel * dt);                                        },
  interpolate:      function(a,b,percent)       { return a + (b-a)*percent                                        },
  easeIn:           function(a,b,percent)       { return a + (b-a)*Math.pow(percent,2);                           },
  easeOut:          function(a,b,percent)       { return a + (b-a)*(1-Math.pow(1-percent,2));                     },
  easeInOut:        function(a,b,percent)       { return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        },
  exponentialFog:   function(distance, density) { return 1 / (Math.pow(Math.E, (distance * distance * density))); },

  increase:  function(start, increment, max) { // with looping
    var result = start + increment;
    while (result >= max)
      result -= max;
    while (result < 0)
      result += max;
    return result;
  },

  project: function(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera.x     = (p.world.x || 0) - cameraX;
    p.camera.y     = (p.world.y || 0) - cameraY;
    p.camera.z     = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth/p.camera.z;
    p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
    p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
    p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
  },

  overlap: function(x1, w1, x2, w2, percent) {
    var half = (percent || 1)/2;
    var min1 = x1 - (w1*half);
    var max1 = x1 + (w1*half);
    var min2 = x2 - (w2*half);
    var max2 = x2 + (w2*half);
    return ! ((max1 < min2) || (min1 > max2));
  }

}

//=========================================================================
// POLYFILL for requestAnimationFrame
//=========================================================================

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback, element) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}

//=========================================================================
// GAME LOOP helpers
//=========================================================================

var Game = {  // a modified version of the game loop from my previous boulderdash game - see http://codeincomplete.com/posts/2011/10/25/javascript_boulderdash/#gameloop
    stagelist: [1, 2, 3, 4, 5],
  run: function(options) {

    Game.loadImages(options.images, function(images) {

      options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble

      Game.setKeyListener(options.keys);

      var canvas = options.canvas,    // canvas render target is provided by caller
          update = options.update,    // method to update game logic is provided by caller
          render = options.render,    // method to render the game is provided by caller
          step   = options.step,      // fixed frame step (1/fps) is specified by caller
          stats  = options.stats,     // stats instance is provided by caller
          now    = null,
          last   = Util.timestamp(),
          dt     = 0,
          gdt    = 0;

      function frame() {
        now = Util.timestamp();
        dt  = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
        gdt = gdt + dt;
        while (gdt > step) {
          gdt = gdt - step;
          update(step);
        }
        render();
        stats.update();
        last = now;
        requestAnimationFrame(frame, canvas);
      }
      frame(); // lets get this party started
      Game.playMusic();
    });
  },

  //---------------------------------------------------------------------------

    loadImages: function (names, callback) { // load multiple images and callback when ALL images have loaded
       
        b %= mapchoice.length
        var gamemap = mapchoice[b];
        var result = [];
    var count  = names.length;

    var onload = function() {
      if (--count == 0)
        callback(result);
    };

    for(var n = 0 ; n < names.length ; n++) {
      var name = names[n];
      result[n] = document.createElement('img');
      Dom.on(result[n], 'load', onload);
        result[n].src = "GameMap/images_"+gamemap+"/" + name + ".png";
    }
        b++;
  },

  //---------------------------------------------------------------------------

  setKeyListener: function(keys) {
    var onkey = function(keyCode, mode) {
      var n, k;
      for(n = 0 ; n < keys.length ; n++) {
        k = keys[n];
        k.mode = k.mode || 'up';
        if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
          if (k.mode == mode) {
            k.action.call();
          }
        }
      }
    };
    Dom.on(document, 'keydown', function(ev) { onkey(ev.keyCode, 'down'); } );
    Dom.on(document, 'keyup',   function(ev) { onkey(ev.keyCode, 'up');   } );
  },

  //---------------------------------------------------------------------------

  stats: function(parentId, id) { // construct mr.doobs FPS counter - along with friendly good/bad/ok message box

    var result = new Stats();
    result.domElement.id = id || 'stats';
    Dom.get(parentId).appendChild(result.domElement);

    var msg = document.createElement('div');
    msg.style.cssText = "border: 2px solid gray; padding: 5px; margin-top: 5px; text-align: left; font-size: 1.15em; text-align: right;";
      msg.innerHTML = "&#x76EE;&#x524D;&#x904A;&#x6232;&#x8996;&#x7A97;&#x8868;&#x73FE;&#x70BA; ";
    Dom.get(parentId).appendChild(msg);

    var value = document.createElement('span');
      value.innerHTML = "...";
    msg.appendChild(value);

    setInterval(function() {
      var fps   = result.current();
        var ok = (fps > 50) ? '&#x72C0;&#x6CC1;&#x826F;&#x597D;' : (fps < 30) ? '&#x72C0;&#x614B;&#x6B20;&#x4F73;' : '&#x72C0;&#x614B;&#x5C1A;&#x53EF;';
      var color = (fps > 50) ? 'green' : (fps < 30) ? 'red' : 'gray';
      value.innerHTML       = ok;
      value.style.color     = color;
      msg.style.borderColor = color;
    }, 5000);
    return result;
  },

  //---------------------------------------------------------------------------

  playMusic: function() {
    var m = document.getElementById("audioContainer");
    m.loop = true;
    m.volume = 0.05; // shhhh! annoying music!
    m.muted = (Dom.storage.muted === "true");
    Dom.toggleClassName('mute', 'on', m.muted);
    Dom.on('mute', 'click', function() {
      Dom.storage.muted = m.muted = !m.muted;
      Dom.toggleClassName('mute', 'on', m.muted);
    });
  }

}

//=========================================================================
// canvas rendering helpers
//=========================================================================

function callPlayerImage(image)
{
  var spritesPlayer;
  spritesPlayer = document.createElement('img');
    spritesPlayer.src = "GameMap/CommonImages/PlayerImages/" + image + ".png";
  return spritesPlayer;
}


var Render = {

  polygon: function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  },

  //---------------------------------------------------------------------------

  segment: function(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {

      var r1 = Render.rumbleWidth(w1, lanes),
          r2 = Render.rumbleWidth(w2, lanes),
          l1 = Render.laneMarkerWidth(w1, lanes),
          l2 = Render.laneMarkerWidth(w2, lanes),
          lanew1, lanew2, lanex1, lanex2, lane,
          f = 0.96;
          f1 = 0.935;
          f2 = 0.92;
          f3 = 0.895;
          f4 = 0.75
          f5 = 0.6;
          f6 = 0.4;
          f7 = 0.25;
          f8 = 0.08; 
    
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);
    
    Render.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
    Render.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);

    Render.polygon(ctx, x1 - w1 , y1, x1 + w1, y1, x2 + w2 , y2, x2 - w2, y2, color.road);
      Render.polygon(ctx, x1 - w1 *f, y1, x1 + w1 *f, y1, x2 + w2 *f, y2, x2 - w2 *f, y2, color.road1);
      Render.polygon(ctx, x1 - w1 * f1, y1, x1 + w1 * f1, y1, x2 + w2 * f1, y2, x2 - w2 * f1, y2, color.road2);
      Render.polygon(ctx, x1 - w1 * f2, y1, x1 + w1 * f2, y1, x2 + w2 * f2, y2, x2 - w2 * f2, y2, color.road3);
      Render.polygon(ctx, x1 - w1 * f3, y1, x1 + w1 * f3, y1, x2 + w2 * f3, y2, x2 - w2 * f3, y2, color.road4);
      Render.polygon(ctx, x1 - w1 * f4, y1, x1 + w1 * f4, y1, x2 + w2 * f4, y2, x2 - w2 * f4, y2, color.road5);
      Render.polygon(ctx, x1 - w1 * f5, y1, x1 + w1 * f5, y1, x2 + w2 * f5, y2, x2 - w2 * f5, y2, color.road6);
      Render.polygon(ctx, x1 - w1 * f6, y1, x1 + w1 * f6, y1, x2 + w2 * f6, y2, x2 - w2 * f6, y2, color.road7);
      Render.polygon(ctx, x1 - w1 * f7, y1, x1 + w1 * f7, y1, x2 + w2 * f7, y2, x2 - w2 * f7, y2, color.road8);
      Render.polygon(ctx, x1 - w1 * f8, y1, x1 + w1 * f8, y1, x2 + w2 * f8, y2, x2 - w2 * f8, y2, color.road9);
    //console.log(color.road);
    
    if (color.lane) {
      lanew1 = w1*2/lanes;
      lanew2 = w2*2/lanes;
      lanex1 = x1 - w1 + lanew1;
      lanex2 = x2 - w2 + lanew2;
      for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
        Render.polygon(ctx, lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
    }
    
    Render.fog(ctx, 0, y1, width, y2-y1, fog);
  },

  //---------------------------------------------------------------------------

  background: function(ctx, background, width, height, layer, rotation, offset) {

    rotation = rotation || 0;
    offset   = offset   || 0;

    var imageW = layer.w/2;
    var imageH = layer.h;

    var sourceX = layer.x + Math.floor(layer.w * rotation);
    var sourceY = layer.y
    var sourceW = Math.min(imageW, layer.x+layer.w-sourceX);
    var sourceH = imageH;
    
    var destX = 0;
    var destY = offset;
    var destW = Math.floor(width * (sourceW/imageW));
    var destH = height;

    ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
    if (sourceW < imageW)
      ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
  },

  //---------------------------------------------------------------------------

  sprite: function(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY) {

                    //  scale for projection AND relative to roadWidth (for tweakUI)
    var destW  = (sprite.w * scale * width/2) * (SPRITES.SCALE * roadWidth);
    var destH  = (sprite.h * scale * width/2) * (SPRITES.SCALE * roadWidth);

    destX = destX + (destW * (offsetX || 0));
    destY = destY + (destH * (offsetY || 0));

    var clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;
    if (clipH < destH)
      ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h*clipH/destH), destX, destY, destW, destH - clipH);

  },

  //---------------------------------------------------------------------------

  player: function(ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {

    var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
    var sprite;
      var spritesPlayer = sprites;

      switch (steer) {
           case 90: case 80: 
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 1079, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_right_3");
              }
              else {
                  sprite = { x: 0, y: 0, w: 1085, h: 500 };
                  spritesPlayer = callPlayerImage("player_right_3");
              };
              break;
          case 70: case 60: case 50:
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 1007, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_right_2");
              }
              else {
                  sprite = { x: 0, y: 0, w: 1014, h: 500 };
                  spritesPlayer = callPlayerImage("player_right_2");
              };
              break;
          case 40: case 30: case 20:
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 885, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_right_1");
              }
              else {
                  sprite = { x: 0, y: 0, w: 909, h: 500 };
                  spritesPlayer = callPlayerImage("player_right_1");
              }
              break;
          case 10: case 0: case -10:
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 775, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_Uphill");
              }
              else {
                  sprite = { x: 0, y: 0, w: 800, h: 500 };
                  spritesPlayer = callPlayerImage("player_front");
              }
              break;
          case -20: case -30: case -40:
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 885, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_left_1");
              }
              else {
                  sprite = { x: 0, y: 0, w: 909, h: 500 };
                  spritesPlayer = callPlayerImage("player_left_1");
              }
              break;
          case -50: case -60: case -70:
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 1007, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_left_2");
              }
              else {
                  sprite = { x: 0, y: 0, w: 1014, h: 500 };
                  spritesPlayer = callPlayerImage("player_left_2");
              }
              break;
           case -80: case -90: 
              if (updown > 0) {
                  sprite = { x: 0, y: 0, w: 1079, h: 550 };
                  spritesPlayer = callPlayerImage("playerfront_uphill_left_3");
              }
              else {
                  sprite = { x: 0, y: 0, w: 1085, h: 500 };
                  spritesPlayer = callPlayerImage("player_left_3");
              }
              break;
      } 

    Render.sprite(ctx, width, height, resolution, roadWidth, spritesPlayer, sprite, scale, destX, destY + bounce, -0.5, -1);
  },

  //---------------------------------------------------------------------------

  fog: function(ctx, x, y, width, height, fog) {
    if (fog < 1) {
      ctx.globalAlpha = (1-fog)
      ctx.fillStyle = COLORS.FOG;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  },

  rumbleWidth:     function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(6,  2*lanes); },
  laneMarkerWidth: function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes); }

}

//=============================================================================
// GAME STAGE BUILDER
//=============================================================================

var Stage = {
    stageList: [1, 2, 3, 4],
    NewGame: true,
    stagePtr: 0,

    changeStage: function () {

        Stage.stagePtr = (Stage.stagePtr + 1) % Stage.stageList.length;
        //   	Stage.stagePtr= (Stage.stagePtr+1);
        if (Stage.stagePtr > 0 && Stage.stagePtr < Stage.stageList.length) {
            Game.loadImages(
                ["background"   , "sprites", "playerFront", "item1"     , "item2"     , // 0 ,1 ,2 ,3 ,4
                    "item3"     , "item4"  , "item5"      , "tree1"     , "tree2"     , // 5 ,6 ,7 ,8 ,9
                    "tree3"     ,"tree4"   ,"tree5"       , "tree6"     , "tree7"     , // 10,11,12,13,14
                    "prop1"     , "prop2"  , "prop3"      , "prop4"     , "bg1"       , // 15,16,17,18,19
                    "bg2"       , "bg3"    , "item6"      , "billboard1", "billboard2", // 20,21,22,23,24
                    "billboard3", "prop5"  , "prop6"],                                  // 25,26,27

                function (images) {
                    background = images[0];
                    sprites = images[1];
                    playerFront = images[2];
                    item1 = images[3];
                    item2 = images[4];
                    item3 = images[5];
                    item4 = images[6];
                    item5 = images[7];

                    tree1 = images[8];
                    tree2 = images[9];
                    tree3 = images[10];
                    tree4 = images[11];
                    tree5 = images[12];
                    tree6 = images[13];
                    tree7 = images[14];

                    prop1 = images[15];
                    prop2 = images[16];
                    prop3 = images[17];
                    prop4 = images[18];
                    bg1 = images[19];
                    bg2 = images[20];
                    bg3 = images[21];

                    item6 = images[22];

                    billboard1 = images[23];
                    billboard2 = images[24];
                    billboard3 = images[25];
                    prop5 = images[26];
                    prop6 = images[27];



                    props = [prop1, prop2, prop3, prop4, prop5, prop6];
                    trees = [tree1, tree2, tree3, tree4, tree5, tree6, tree7];
                    billboard = [billboard1, billboard2, billboard3]
                    // tree1 = images[16];

                    reset();
                    //Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
                    //updateHud('fast_lap_time', formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
                }
            );
            // var audio = document.getElementById("music");
            // //audio.stop();
            // var source = document.getElementById("audioSource");
            // audio.load();
            // source.src = "music/music" + Stage.stageList[Stage.stagePtr] + ".mp3";
            // Game.playMusic();
            //console.log("hello");
            if (Stage.stagePtr < Stage.stageList.length - 1)
                // if(Stage.stagePtr < Stage.stageList.length-1)
                setTimeout(Stage.changeStage, maxTime * 1000);
            else
                setTimeout(stop(), maxTime * 1000);

        }


    }
}
function displayToast(msg, time) {
    var toast = $("#toast");
    var hide = function () { toast.removeClass("show"); }
    toast.html(msg);
    toast.addClass("show");
    clearTimeout(hide);
    if (time != "inf") setTimeout(hide, time || 2000);
}
function stop() {


    keyLeft = keyRight = keySlower = keyFaster = false;
    displayToast("¹CÀ¸µ²§ô", "inf");
   
}

//=============================================================================
// RACING GAME CONSTANTS
//=============================================================================

var KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
  A:     65,
  D:     68,
  S:     83,
  W:     87
};

var COLORS = {
  SKY:  '#f2955b',
    TREE: '#27e612',
    FOG:  '#1f7a1f',

  //color for the road (Game loop in pattern l-d-l-d)
  //LIGHT:  { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC'  },
    LIGHT: { road: '#6B6B6B', road1: 'yellow', road2: '#696969', road3: 'yellow', road4: '#696969', grass: '#1f7a1f', rumble: '#555555', lane: '#CCCCCC'  },
    DARK: { road: '#696969', road1: 'yellow', road2: '#696969', road3: 'yellow', road4: '#696969', grass: '#1f7a1f', rumble: '#555555'              },
    START: { road: 'black', road4: 'white', road5: 'black', road6: 'white', road7: 'black', road8: 'white', road9: 'black', grass: 'white', rumble: '#555555' },
    START1: { road: 'white', road4: 'black', road5: 'white', road6: 'black', road7: 'white', road8: 'black', road9: 'white', grass: 'white', rumble: '#555555' },
    FINISH: { road: 'black', grass: 'black', rumble: '#555555'                     }
};

var BACKGROUND = {
    HILLS: { x: 1, y: 1, w: 3200, h: 2000 }, //bg2
  SKY:   { x:   1, y:   500, w: 3200, h: 1500 }, //bg1
    TREES: { x: -1000, y: 1, w: 9000, h: 4000 } //bg3
};

var SPRITES = {
  PALM_TREE:              { x:    5, y:    5, w:  215, h:  540 },
  BILLBOARD08:            { x:  230, y:    5, w:  385, h:  265 },
  BILLBOARD09:            { x:  150, y:  555, w:  328, h:  282 },
  BOULDER3:               { x:  230, y:  280, w:  320, h:  220 },
  COLUMN:                 { x:  995, y:    5, w:  200, h:  315 },
  //BILLBOARD01:            { x:  625, y:  375, w:  300, h:  170 },
  //BILLBOARD06:            { x:  488, y:  555, w:  298, h:  190 },
  //BILLBOARD05:            { x:    5, y:  897, w:  298, h:  190 },
  //BILLBOARD07:            { x:  313, y:  897, w:  298, h:  190 },
  //BOULDER2:               { x:  621, y:  897, w:  298, h:  140 },
  // old tree
  // TREE1:                  { x:  783, y:    2, w:  285, h:  500 },
  // TREE2:                  { x: 2,    y:  546, w:  285, h:  500 },
  // TREE3:                  { x: 291,  y:  546, w:  285, h:  500 },
  // TREE4:                  { x: 580,  y:  546, w:  285, h:  500 },
  // TREE5:                  { x: 1072, y:    2, w:  285, h:  500 },
  // TREE6:                  { x: 869,  y:  546, w:  285, h:  500 },
  // TREE7:                  { x: 2,    y: 1090, w:  285, h:  500 },

    TREE1: { x: 0, y: 0, w: 0, h: 280 },
    TREE2: { x: 0, y: 0, w: 700, h: 1862 },
    TREE3: { x: 0, y: 0, w: 314, h: 540 },
    TREE4: { x: 0, y: 0, w: 314, h: 540 },
    TREE5: { x: 0, y: 0, w: 314, h: 540 },
    TREE6: { x: 0, y: 0, w: 314, h: 540 },
    TREE7: { x: 0, y: 0, w: 314, h: 540 },

    PROP1: { x: 0, y: 0, w: 550, h: 700 },
    PROP2: { x: 0, y: 0, w: 550, h: 550 },
    PROP3: { x: 0, y: 0, w: 360, h: 270 },
    PROP4: { x: 0, y: 0, w: 360, h: 270 },
    PROP5: { x: 0, y: 0, w: 360, h: 270 },
    PROP6: { x: 0, y: 0, w: 420, h: 420 },

  PLACEHOLDER:            { x:  0,  y:  0, w:  0, h:  0 },


  HOUSE:                  { x: 2,     y:    2, w:  405, h:  315 },
  BILLBOARD04:            { x: 1205, y:  310, w:  268, h:  170 },
  BOULDER1:               { x: 1205, y:  760, w:  168, h:  248 },
  BUSH1:                  { x:    5, y: 1097, w:  240, h:  155 },
  CACTUS:                 { x:  929, y:  897, w:  235, h:  118 },
  BUSH2:                  { x:  255, y: 1097, w:  232, h:  152 },
 // BILLBOARD03:            { x:    5, y: 1262, w:  230, h:  220 },
 // BILLBOARD02:            { x:  245, y: 1262, w:  215, h:  220 },
  STUMP:                  { x:  995, y:  330, w:  195, h:  140 },
  SEMI:                   { x: 1365, y:  490, w:  122, h:  144 },
  TRUCK:                  { x: 1365, y:  644, w:  100, h:   78 },

  //old car
  // CAR03:                  { x: 597, y:  2, w:   89, h:   59 },
  // CAR02:                  { x: 504, y:  2, w:   89, h:   52 },
  // CAR04:                  { x: 690, y:  2, w:   89, h:   50 },
  // CAR01:                  { x: 411, y: 2, w:   89, h:   84 },

  CAR03:                  { x:  0, y:  0, w:   400, h:   387 },
  CAR02:                  { x: 0, y:  0, w:   400, h:   387 },
  CAR04:                  { x: 0, y:  0, w:   400, h:   387 },
  CAR01:                  { x: 0, y: 0, w:   400, h:   387 },
  CAR05:                  { x: 0, y: 0, w:   400, h:   387 },
  CAR06:                  { x: 0, y: 0, w:   400, h:   387 },

    BILLBOARD1: { x: 0, y: 0, w: 1024, h: 1024 },
    BILLBOARD2: { x: 0, y: 0, w: 1024, h: 1024 },
    BILLBOARD3: { x: 0, y: 0, w: 4096, h: 2304 },

  // PLAYER_UPHILL_LEFT:     { x: 547, y:  86, w:   49, h:   80 },
  // PLAYER_UPHILL_STRAIGHT: { x: 504, y: 86, w:   39, h:   80 },
  // PLAYER_UPHILL_RIGHT:    { x: 600, y: 86, w:   49, h:   80 },
  // PLAYER_LEFT:            { x:  1158, y:  546, w:   60, h:   80 },
  // PLAYER_STRAIGHT:        { x: 1361, y:  2, w:   47, h:   80 },
  // PLAYER_RIGHT:           { x:  1222, y:  546, w:   60, h:   80 }

  // PLAYER_UPHILL_LEFT:     { x: 411, y: 2, w:   89, h:   84 }, //placeHolder
  // PLAYER_UPHILL_STRAIGHT: { x: 411, y: 2, w:   89, h:   84 },
  // PLAYER_UPHILL_RIGHT:    { x: 411, y: 2, w:   89, h:   84 },
  // PLAYER_LEFT:            { x: 411, y: 2, w:   89, h:   84 },
  // PLAYER_STRAIGHT:        { x: 411, y: 2, w:   89, h:   84 },
  // PLAYER_RIGHT:           { x: 411, y: 2, w:   89, h:   84 }

    PLAYER_UPHILL_LEFT: { x: 0, y: 0, w: 540, h: 270 },
    PLAYER_UPHILL_STRAIGHT: { x: 0, y: 0, w: 440, h: 275 },
    PLAYER_UPHILL_RIGHT: { x: 0, y: 0, w: 540, h: 270 },
    PLAYER_LEFT: { x: 0, y: 0, w: 1040, h: 270 },
    PLAYER_STRAIGHT: { x: 0, y: 0, w: 400, h: 250 },
    PLAYER_RIGHT: { x: 0, y: 0, w: 540, h: 270 }
};

SPRITES.SCALE = 0.3 * (1/SPRITES.PLAYER_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth

// SPRITES.BILLBOARDS = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
SPRITES.PLANTS     = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.TREE3, SPRITES.TREE4, SPRITES.TREE5, SPRITES.TREE6, SPRITES.TREE7 ];
SPRITES.CARS = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.CAR05, SPRITES.CAR06 ];
SPRITES.PROPS = [SPRITES.PROP1, SPRITES.PROP2, SPRITES.PROP3, SPRITES.PROP4, SPRITES.PROP5, SPRITES.PROP6];
SPRITES.BILLBOARD = [SPRITES.BILLBOARD1, SPRITES.BILLBOARD2, SPRITES.BILLBOARD3];
