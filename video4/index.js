// import the robotjs library
var robot = require('robotjs');
const { Image } = require('image-js');
const screenshot = require('screenshot-desktop')
const { getPaletteFromURL } = require('color-thief-node');

var oak_cnt = 0;
var tree_cnt = 0;
var falses = 0
var rights = 0;
var dateStart = new Date();
var total = 0;
let err = [0,0,0,0,0,0,0,0,0];
let succ = [0,0,0,0,0,0,0,0,0];

async function main(err, succ) {
    console.log("Starting...");
    sleep(4000);
    checkInv();
    checkRun();
    var rotationCnt = 0;
    // infinite loop. use ctrl+c in terminal to stop the program
    while (true) {
        var diffMins = Math.abs(new Date().getTime() - dateStart.getTime()) / 60000;

        if(Math.ceil(diffMins)%10 == 0){
            checkRun();
        }
        if(rotationCnt == 10){
            clickFailSafe();
        }
        // find a tree to click on
        var tree = await findTree(err, succ);
        // if we couldn't find a tree, try rotating the camera and
        // return to the start of the loop
        if (tree == false) {
            rotateCamera();
            rotationCnt++
            continue;
        }
        else{
            rotationCnt = 0;
        }

        // chop down the tree we found
        //console.log('trying to chop')
        drop(tree.tree)
        sleep(50);
        robot.moveMouse(tree.x, tree.y);
        sleep(100);
        robot.mouseClick();
        // wait for walking and chopping to complete.
        // dropLogs() will wait for longer if needed
        sleep(500);

        dropLogs(tree.tree);
    }
}

function checkRun(){
    var invCols = ["71261d","441812"];
    var y = 186;
    var x0 = 1315;
    var x1 = 1360;
    var res = checkColor(y, x0, x1, 15, invCols, false);
    if(res.index == null){
        console.log('not currently runnin - clickin it now')
        robot.moveMouse(x0 - 20 , y)
        robot.mouseClick()
    }
}

function checkInv(){
    var invCols = ["ecda67","dca365"];
    var y = 775;
    var x0 = 1130;
    var x1 = 1140;
    var res = checkColor(y, x0, x1, 5, invCols, false);
    if(res.index == null){
        console.log('inventory in not open - clickin it now')
        robot.keyToggle('escape', 'down');
        sleep(500);
        robot.keyToggle('escape', 'up');
    }
}
function clickFailSafe(){
    console.log('clickfailsafe')
    var x = 1430;
    var y = 140;
    robot.moveMouse(x, y)
    robot.mouseClick()
}

function dropLogs(tree) {
    var inventory_x = 1290;
    var inventory_y = 463;
    var inventory_log_color_tree = ["9b7637", "684925", "5f4322"];
    var inventory_log_color_oak = ["916d44", "6e4f27", "74532a"];

    // check to confirm that logs are there
    var pixel_color = robot.getPixelColor(inventory_x, inventory_y);

    if(inventory_log_color_oak.includes(pixel_color)){
        //console.log("Oak detected")
        if(tree != "oak"){
            falses++;
            var acc = 100 * rights / (falses + rights);
            console.log("Faulty prediction, accuracy: ",acc);
        }
        else{
            rights++;
        }
    }
    else if(!inventory_log_color_tree.includes(pixel_color)){
        //console.log("Tree detected");
        if(tree != "tree"){
            falses++;
            var acc = 100 * rights / (falses + rights);
            console.log("Faulty prediction, accuracy: ",acc);
        }
        else{
            rights++;
        }
    }
    else{
        console.log("Can't identify")
    }

    var wait_cycles = 0;
    var max_wait_cycles = 12;
    var logsTillDrop = 1;
    if(tree == "oak"){
        max_wait_cycles = max_wait_cycles * 4;
        logsTillDrop  = 4;
    }

    while (!inventory_log_color_oak.includes(pixel_color) && !inventory_log_color_tree.includes(pixel_color) && wait_cycles < max_wait_cycles) {
        // we don't have a log in our inventory yet at the expected position.
        // waiting a little bit longer to see if the chopping finishes
        sleep(500);
        // sample the pixel color again after waiting
        pixel_color = robot.getPixelColor(inventory_x, inventory_y);
        // increment our counter
        wait_cycles++;
    }

    drop(tree)
}
function drop(tree) {
    var inventory_log_color_tree = "9b7637";
    var inventory_log_color_oak = "916d44";
    var x= 1274;
    var y = 464;

    r = checkColor(y, 1310, 1330, 5, [inventory_log_color_tree, inventory_log_color_oak], false)
    
    if (r.index == 0) {
        tree_cnt++;
        total++;
        var diff = Math.abs(new Date().getTime() - dateStart.getTime()) / 3600000;
        var xph = (oak_cnt * 37 + tree_cnt * 25) / diff;
        console.log('Dropping tree #', tree_cnt, " --- total: ", total, " --- xph: ", Math.round(xph) );
    }else if(r.index == 1){
        oak_cnt++;
        total++;
        var diff = Math.abs(new Date().getTime() - dateStart.getTime()) / 3600000;
        var xph = (oak_cnt * 37 + tree_cnt * 25) / diff;
        console.log('Dropping oak #', oak_cnt, " --- total: ", total, " --- xph: ", Math.round(xph) );
    }
    else{
        return;
    }
    var dropRowsCnt;
    if(tree == "oak"){
        dropRowsCnt = 6;
        console.log("oak logs drop")
    }else{
        dropRowsCnt = 1;
    }
    for (let row = 0; row < dropRowsCnt; row++) {
        var rowDiff = 45;
        var y_ = r.y + row * rowDiff;
        robot.moveMouse(r.x, y_);
        robot.mouseClick('right');
        // adding a little delay here because sometimes the second click misses
        sleep(300);
        robot.moveMouse(r.x, y_ + 50);
        robot.mouseClick();
        sleep(100);
    }
    sleep(300);
}

function testScreenCapture() {
    // taking a screenshot
    var img = robot.screen.capture(0, 0, 1920, 1080);

    // testing: the pixel at 30, 18 when I screen capture VSCode should be that bright blue:
    // RBG of 35, 170, 242 which we convert into hex color #23aaf2
    var pixel_color = img.colorAt(30, 18);
    console.log(pixel_color);
    // when I test this I get 23a9f2, which is very close to what we expect.
}

async function findTree(err, succ) {
    // take a screenshot from just the middle of our screen.
    // I have the upper left corner of the image starting at x = 300, y = 300, and size of
    // the image at width = 1300, height = 400.
    // you should adjust this to your own screen size. you might also try reducing the size
    // if this is running slow for you.
    var x = 300, y = 300, width = 1000, height = 300;
    var img = robot.screen.capture(x, y, width, height);

    // make an array that contains colors of the trees we want to click on.
    // I'm targeting the brown colors of the trunks.
    var tree_colors = ["110c05", "110c05","402e17","453019","0f0a07","0a0705","21140e"];

    // sample up to 500 random pixels inside our screenshot until we find one that matches
    // a tree color.
    for (var i = 0; i < 700; i++) {
        var random_x = getRandomInt(0, width-1);
        var random_y = getRandomInt(0, height-1);
        var sample_color = img.colorAt(random_x, random_y);

        if (tree_colors.includes(sample_color)) {
            // because we took a cropped screenshot, and we want to return the pixel position
            // on the entire screen, we can account for that by adding the relative crop x and y
            // to the pixel position found in the screenshot;
            var screen_x = random_x + x;
            var screen_y = random_y + y;
            confirmInfo = await confirmTreeAsync(screen_x, screen_y);
            //confirmInfo = confirmTree(screen_x, screen_y);
            // if we don't confirm that this coordinate is a tree, the loop will continue
            if (confirmInfo.found) {
                succ[tree_colors.indexOf(sample_color)] = succ[tree_colors.indexOf(sample_color)] + 1;
                console.log("Found a ", confirmInfo.tree ," at: " + screen_x + ", " + screen_y + " color " + sample_color);
                console.log('succ counts:',succ);
                return {x: screen_x, y: screen_y, tree: confirmInfo.tree};

            } else {
                err[tree_colors.indexOf(sample_color)] = err[tree_colors.indexOf(sample_color)] + 1;

                // this just helps us debug the script
                console.log("Unconfirmed tree at: " + screen_x + ", " + screen_y + " color " + sample_color);
                console.log('err counts:',err);
            }
        }
    }
    
    // did not find the color in our screenshot
    return false;
}

function rotateCamera() {
    //console.log("Rotating camera");
    robot.keyToggle('right', 'down');
    sleep(400);
    robot.keyToggle('right', 'up');
}

async function confirmTreeAsync(screen_x, screen_y) {
    robot.moveMouse(screen_x, screen_y);
    // wait a moment for the help text to appear
    sleep(100);

    await screenshot({ filename: 'shot.jpg' });
    let image = await Image.load('shot.jpg');
    let x0 = 96, y0 = 40, w = 43, h = 9;
    let cropped1 = image.crop({
      x: x0,
      y: y0,
      width: w,
      height: h
    });

    let found = false;
    await cropped1.save("cropped.jpg");
    const colorPallete = await getPaletteFromURL('cropped.jpg');
  
    for (const element of colorPallete) {
      if (element[0] < 90 && element[1] > 150 && element[2] > 150){
        //console.log('good color!')
        found = true;
        break;
      }
    };
  
    //var d2 = new Date().getTime();
    //console.log('runtime ', (d2-d)/1000)
    return {found:found, tree:"tree"};
  }

function confirmTree(screen_x, screen_y) {

    var found  = false;
    var tree;
    // first move the mouse to the given coordinates
    robot.moveMouse(screen_x, screen_y);
    // wait a moment for the help text to appear
    sleep(500);
    //robot.mouseClick('right');
    //var col = robot.getPixelColor(screen_x + 29, screen_y + 27);
    /* if(col == "00ffff"){
        console.log("this is a normal tree");
        found = true;
        tree = "tree";
    } */
    //sleep(10000)
    r = checkColor(40, 100, 150, 30, ["00c8c8"], true)
    r.index !== null ? found = true : found ;
    r.sum > 13 && r.sum < 17 ? tree = "oak" : tree = "tree";
    //console.log('confirmed as ',tree)
    return {found:found, tree:tree};
}

// utility functions
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkColor(y, xMin, xMax, error, targets, scan) {
    index = null;
    xHit = null;
    sum = null;
    targets.forEach((col, j) => {
        rgb = hexToRgb(col);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
        rMin = Math.max(0, r - error);
        rMax = Math.min(255, r + error);

        gMin = Math.max(0, g - error);
        gMax = Math.min(255, g + error);

        bMin = Math.max(0, b - error);
        bMax = Math.min(255, b + error);

        for (let i = xMin; i < xMax; i++) {
            //robot.moveMouse(i, y)
            var pixel_color = robot.getPixelColor(i, y);
            rgb_pixel = hexToRgb(pixel_color);
            r_pixel = rgb_pixel.r;
            g_pixel = rgb_pixel.g;
            b_pixel = rgb_pixel.b;

            if (r_pixel >= rMin && r_pixel <= rMax && g_pixel >= gMin && g_pixel <= gMax && b_pixel >= bMin && b_pixel <= bMax) {
                //console.log("GOTCHA ", i, " ", y)
                index = j;
                xHit = i;
                
                if(scan){
                    sum++;
                }
                else{
                    break;
                }
            }
        }
    });
    
    //if(scan) {console.log('sum: '+sum)};
    return {index:index, x:xHit, y:y, sum:sum };
}



main(err, succ);
