document.addEventListener('DOMContentLoaded', function () {
	
	/*maze datatype is a nested array filled with objects with
	four properties, n, s, e, w that can have true or false values
	true means a wall is in that direction in that cell
	also a 'visited' property for the backtracker
	added an isVisible property for rendering purposes*/
	function initMaze(height, width, startY, startX, vision, persist, responsiveBorder){
		var result = [];
		//build an open maze without walls
		for (var y = 0; y < height; y++){
			var thisRow = [];
			for (var x = 0; x < width; x++){
				thisRow.push( { 'n':true, 's':true, 'e':true, 'w':true, 'visited':false, 'isVisible':false } );
			}
			result.push(thisRow);
		}
		result.playerY = startY;
		result.playerX = startX;
		//place the goal tile randomly, for now
		result.goalY = Math.floor(Math.random() * height);
		result.goalX = Math.floor(Math.random() * width);
		result.vision = vision;
		result.persist = persist;
		result.responsiveBorder = responsiveBorder;
		//the farthest two objects can be apart in the maze
		result.maxManhattan = width + height - 2; 
		return result;
	}
	
	//Knuth shuffle for arrays
	function shuffleArr(arr) {
		var curIdx = arr.length - 1;
		var swap;
		var randIdx;

		while (curIdx !== 0){
			randIdx = Math.floor(Math.random() * (curIdx + 1));
			swap = arr[curIdx];
			arr[curIdx] = arr[randIdx];
			arr[randIdx] = swap;
			curIdx--;
		}
		//some messy math that makes the walls brighter as you near the goal
	return arr;
	};

	//get the Manhattan distance between two sets of points
	function getManhattan(y1, x1, y2, x2) {
		return Math.abs(y1-y2) + Math.abs(x1 - x2);
	}

	//use a recursive backtracker to dig out the maze
	function digMaze(maze, y, x) {
		//first, mark the current cell as having been visited
		maze[y][x]['visited'] = true;

		//create a shuffled list of the directions to try digging
		var directions = [[1, 0, 's', 'n'], [-1,0, 'n', 's'], [0, -1, 'w', 'e'], [0, 1, 'e', 'w']];
		directions = shuffleArr(directions);

		//now test each direction and recurse if valid
		for (var i = 0; i < directions.length; i ++) {
			var nextY = y + directions[i][0];
			var nextX = x + directions[i][1];
			var target = (maze[nextY]) ? maze[nextY][nextX] : undefined; 
			if (target && !(target['visited']) ) {//target exists and not dug into yet
				maze[y][x][directions[i][2]] = false; //dig into it 
				maze[nextY][nextX][directions[i][3]] = false; //dig corresponding wall in next cell
				digMaze(maze, nextY, nextX);
			}
		}
	}
	 
	//render the maze as an html table with borders for walls
	//and return a documentFragment to be drawn later
	//responsiveBorder boolean determines whether or not to
	//make walls brighter as player nears goal
	function makeViewFragment(maze) {
		var width = maze.length; 
		var height = maze[0].length;
		var result = document.createDocumentFragment();
		const LIGHTEST = 150; //the lightest white we want the responsive lines to be
		var manhattanRatio = getManhattan(maze.playerX, maze.playerY, maze.goalX, maze.goalY)
																			/maze.maxManhattan;
		//for responsive maze set wall colors to black at the goal and LIGHTEST at max distance	
		var colorString = (maze.responsiveBorder) ? 
			Math.floor(LIGHTEST * manhattanRatio).toString(16).repeat(3) : 'FFFFFFF';
			//sometimes the ratio'd colorstring is 1 digit, if so, make it black
			if (colorString.length < 6) colorString = '000000'; 
		console.log(manhattanRatio + ' ' + colorString);
		var plainBorder = '3px solid #' + colorString;
		var goalBorder = '3px solid gold';
		var cellsize = Math.floor(100/width) + '%';
		var tab = result.appendChild(document.createElement('table'));
    tab.setAttribute('id', 'maze');
		for (var y = 0; y < height; y++) {
			var row = tab.appendChild(document.createElement('tr'));
			for (var x = 0; x < width; x++) {
				var cell = row.appendChild(document.createElement('td'));
				var room = maze[y][x];
				cell.style['width'] = cellsize;
				cell.style['height'] = cellsize;
				if (room['isVisible']) {
					var border = ( y == maze.goalY && x == maze.goalX) ?
						goalBorder : plainBorder;
					if (room['n']) cell.style['border-top'] = border;
					if (room['s']) cell.style['border-bottom'] = border;
					if (room['e']) cell.style['border-right'] = border;
					if (room['w']) cell.style['border-left'] = border;
				}
			}
		}
		return result;
	}

	//render the player in the maze
	function drawPlayer(maze, view) {
		//remove the old player <p> if it exists
		var player = document.getElementById('player');
		if (player) player.parentNode.removeChild(player);
		var y = maze.playerY;
		var x = maze.playerX;
		var row = view.children[y];
		var entry = row.children[x];
		var player = entry.appendChild(document.createElement('p'));
		player.setAttribute('id', 'player');
	}

	//use player position to set visibility on maze cells
	function calcVision (maze) {
		//first, set all maze cells to invisible if !persist
		if (!maze.persist) {
			for (var row = 0; row < maze.length; row++)
				for (var col = 0; col < maze[0].length; col++)
					maze[row][col]['isVisible'] = false;
		}
		//start our search at the player's location
		var curY = maze.playerY;
		var curX = maze.playerX
		maze[curY][curX]['isVisible'] = true;
		//now look north
		while (maze.playerY - --curY < maze.vision && maze[curY] && maze[curY][curX]['s'] === false ) 
			maze[curY][curX]['isVisible'] = true;
		curY = maze.playerY;
		curX = maze.playerX
		//look south
		while (++curY - maze.playerY < maze.vision && maze[curY] && maze[curY][curX]['n'] === false ) 
			maze[curY][curX]['isVisible'] = true;
		curY = maze.playerY;
		curX = maze.playerX
		//look west
		while (maze.playerX - --curX < maze.vision && maze[curY][curX] && maze[curY][curX]['e'] === false ) 
			maze[curY][curX]['isVisible'] = true;
		curY = maze.playerY;
		curX = maze.playerX
		//look east
		while (++curX - maze.playerX < maze.vision && maze[curY][curX] && maze[curY][curX]['w'] === false ) 
			maze[curY][curX]['isVisible'] = true;
	}
		
  //change the player's location in the maze, returning 
	//true for a legal move and false for a failed one
	function movePlayer(maze, dir) {
			if (maze[maze.playerY][maze.playerX][dir] === false) {
					if (dir === 'n')  maze.playerY -= 1
					else if (dir === 's')  maze.playerY += 1
					else if (dir === 'e')  maze.playerX += 1
					else if (dir === 'w')  maze.playerX -= 1
					return true;
			}
		return false;
	}

	function initExplorer (yDim, xDim, startY, startX, vision, persist, responsiveBorder) {
		//make the maze and dig it out
		var maze = initMaze(yDim, xDim, startY, startX, vision, persist, responsiveBorder);
		digMaze(maze, 0, 0);
		//set up the initial view
		calcVision(maze);
		//set up the viewing object
		var view = makeViewFragment(maze);
		return [maze, view];
	}

	//draw the maze fragment to the screen
	function renderMaze(view) {
		//first remove the previous view, if it exists
		var oldView = document.getElementById('maze');
		if (oldView) oldView.parentNode.removeChild(oldView);
		//now render the new one
		document.body.appendChild(view);
		var mazeElem = document.getElementById('maze');
		//do some centering
		mazeElem.style.top = ((window.innerHeight - mazeElem.offsetHeight) / 2).toString() + 'px';
		mazeElem.style.left = ((window.innerWidth - mazeElem.offsetWidth) / 2).toString() + 'px';
		return mazeElem;
	}

	//function to toggle keyboard control of player 
	function allowKeys(bool, maze, view) {
		if (!bool) document.onkeydown = undefined;
		else
			document.onkeydown = function(e) {
				e = e || window.event;
				var dir;
				if (e.keyCode === 72 || e.keyCode == 37) dir = 'w';
				else if (e.keyCode === 75 || e.keyCode == 38) dir = 'n';
				else if (e.keyCode === 74 || e.keyCode == 40) dir = 's';
				else if (e.keyCode === 76 || e.keyCode == 39) dir = 'e';
				else return; //don't do stuff for unlisted keys
				movePlayer(maze, dir);
				calcVision(maze);
				var newView = makeViewFragment(maze);
				newView = renderMaze(newView);
				drawPlayer(maze, newView);
				if (maze.playerY == maze.goalY && maze.goalX === maze.playerX) alert('You win!');
			}
	}


	//this function encapsulates all the code to make a 2d maze exploration happen
	function explore2d (height, width, startY, startX, vision, persist, responsiveBorder) {
		var mazeData = initExplorer(height, width, startY, startX, vision, persist, responsiveBorder); 
		var maze = mazeData[0];
		var view = mazeData[1];
		var mazeElem = renderMaze(view);
		drawPlayer(maze, mazeElem);
		allowKeys(true, maze, mazeElem);
	}

	//test code
	explore2d(5, 5, 0, 0, 3, true, true);
});
