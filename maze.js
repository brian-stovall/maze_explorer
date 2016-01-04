document.addEventListener('DOMContentLoaded', function () {
	
	/*maze datatype is a nested array filled with objects with
	four properties, n, s, e, w that can have true or false values
	true means a wall is in that direction in that cell
	also a 'visited' property for the backtracker*/
	function initMaze(height, width, startY, startX){
		var result = [];
		//build an open maze without walls
		for (var y = 0; y < height; y++){
			var thisRow = [];
			for (var x = 0; x < width; x++){
				thisRow.push( { 'n':true, 's':true, 'e':true, 'w':true, 'visited':false } );
			}
			result.push(thisRow);
		}
		result.playerY = startY;
		result.playerX = startX;
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
	return arr;
	};

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
	function makeViewFragment(maze) {
		var width = maze.length;
		var height = maze[0].length;
		var result = document.createDocumentFragment();
		var border = '1px solid white';
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
				if (room['n']) cell.style['border-top'] = border;
				if (room['s']) cell.style['border-bottom'] = border;
				if (room['e']) cell.style['border-right'] = border;
				if (room['w']) cell.style['border-left'] = border;
			}
		}
		return result;
	}

	//render the player in the maze
	function drawPlayer(data, maze) {
		//remove the old player <p> if it exists
		var player = document.getElementById('player');
		if (player) player.parentNode.removeChild(player);
		var y = data.playerY;
		var x = data.playerX;
		var row = maze.children[y];
		var entry = row.children[x];
		var player = entry.appendChild(document.createElement('p'));
		player.setAttribute('id', 'player');
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

	function initExplorer ( yDim, xDim, startY, startX) {
		//make the maze and dig it out
		var data = initMaze(yDim, xDim, startY, startX);
		digMaze(data, 0, 0);
		//set up the viewing object
		var view = makeViewFragment(data);
		return [data, view];
	}

	//draw the maze fragment to the screen
	function renderMaze(view) {
		document.body.appendChild(view);
		return document.getElementById('maze');
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
				drawPlayer(maze, view);
			}
	}

	//tests
	var mazeData = initExplorer (10,10, 5, 5);
	var maze = mazeData[0];
	var view = mazeData[1];
	var mazeElem = renderMaze(view);
	drawPlayer(maze, mazeElem);
	allowKeys(true, maze, mazeElem);
});
