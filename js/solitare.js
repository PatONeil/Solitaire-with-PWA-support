/* jshint esversion: 8   */
let deck = [];
let duration = 500;
let numberOfTurnCards = 3;
let numberOfTurnsAllowed = 1;
let numberOfTurns = 1;
let backgroundColor = '#adff2f';
let colorSplit = ['#adff2f','black'];
let animationCounter = 0;
let undoList = [];
let currentScore = 0;
let lastVegasScore = 0;
let currentVegasScore = 0;
let solverScore = 0;
let gameOver = false;
let simulation = false;
let ignoreUndo = 0;
let AIScore = false;

function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex],array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}
function generateCards() {
    var scale = document.getElementById('deckArea').clientWidth / 219;
    let num = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
    let cdhs = {
        clubs: {
            color: "black",
            image: "clubs"
        },
        diamonds: {
            color: "red",
            image: "diamonds"
        },
        hearts: {
            color: "red",
            image: "hearts"
        },
        spades: {
            color: "black",
            image: "spades"
        }
    };
    deck = [];
    for (let cardType in cdhs) {
        let card = cdhs[cardType];
        for (let cardNumber of num) {
            let cardId = num.indexOf(cardNumber);
            let largeImage = card.image;
            let lgImageClass = "";
            if (cardNumber == "J" || cardNumber == "Q" || cardNumber == "K") {
                largeImage = cardType + "-" + cardNumber;
                lgImageClass = "faceCard";
            }
            let s = `
					<div id="card${cardType}${cardNumber}" 
						   class="card down ${card.color}" 
						   data-number="${cardId}"  
						   data-color="${card.color}" 
						   data-cardtype="${cardType}" 
						   data-position="0" 
						   style="scale:${scale}">
						<div class="back" style="">
							<img src="images/cardBackRed.png" >
						</div>
						<div class="front">
							<div class="cardNum" style="">${cardNumber}</div>
							<img class="cardImage1" src="images/${card.image}.png" style="">
							<img class="cardImage2 ${lgImageClass}" src="images/${largeImage}.png" style="">
						</div>
					</div>`;
            deck.push({
                html: s,
                number: cardNumber,
                color: card.color
            });
        }
    }
    shuffle(deck);
    shuffle(deck);
}
function setupGameCards() {
	let vegas ={'1':{'1':40,'3':125,'2000':140},'3':{'1':15,'3':45,'2000':55}}	
    undoList = [];
    AIScore = false;
    gameOver = false;
	numberOfTurns = 1
    //lastVegasScore = currentVegasScore;
    currentVegasScore -= vegas[numberOfTurnCards][numberOfTurnsAllowed];
    lastVegasScore = currentVegasScore;
    currentScore = 0;
    document.getElementById('currentScore').innerHTML = currentScore;
    document.getElementById('totalScore').innerHTML = currentVegasScore - currentScore;
    // delete any previous cards in DOM
	let cards = document.querySelectorAll('.card');
    cards.forEach(function(card) {
        card.remove();
    });
    for (let card of deck) {
        document.getElementById('deckArea').innerHTML += card.html;
    }
    cards = document.querySelectorAll('.card');
    for (let card of cards) {
        card.style.top = card.offsetTop + "px";
        card.style.left = card.offsetLeft + "px";
    }
	let color = colorSplit[0][1]>colorSplit[0][5]?"images/cardBackRed.png":"images/cardBackBlue.png";
	document.querySelectorAll('.card .back img').forEach(function(im){im.setAttribute('src',color)});
    // fix height after of playArea and layoutArea after scaling for window size
    let height = cards[0].clientHeight * cards[0].style.scale;
    document.querySelectorAll("#playArea,  #layoutArea, .layoutCard, #deckArea").forEach(function(element) {
        element.style.height = height + "px";
    });
    // play out layout from deck cards;
    let layouts = document.getElementsByClassName('layoutCard');
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            let card = document.getElementsByClassName('card')[0];
            //let clone = card.cloneNode(true);
            card.remove();
            if (layouts[j].lastChild)
                card.style.top = (layouts[j].lastChild.offsetTop + 2) + "px";
            else
                card.style.top = layouts[j].offsetTop + "px";
            card.style.left = layouts[j].offsetLeft + "px";
            layouts[j].appendChild(card);
        }
    }
    // turn over first card of each layout area
    for (let i = 0; i < 7; i++) {
        layouts[i].lastChild.classList.remove('down');
        layouts[i].lastChild.classList.add('up');
    }
    addSolitareEvents();
}
function addSolitareEvents() {
    let cards = document.getElementsByClassName('card');
    for (let card of cards) {
        card.addEventListener('click', clickHandler);
    }
    document.getElementById('deckArea').addEventListener('click', clickHandler);
}
async function handleGameOver(rc) {
    if (gameOver)
        return;
    if (rc == 'win' && !gameOver) {
        let x_origin = (window.innerWidth) / 2;
        let y_origin = (window.innerHeight) / 2;
        await animateFinish(x_origin, y_origin);
        await delay(10);
        gameOver = true;
        showGameOverDialog();
    }
    if (rc == 'over' && !gameOver) {
        gameOver = true;
        showGameOverDialog();
    }
	return false;
}
async function clickHandler(e) {
    e.stopPropagation();
    while (animationCounter)
        await delay(0.1);
    let target = e.currentTarget;
    if (!target)
        return false;
    undoList.push([]);
    let parent = target.parentNode;
    let type = "deck";
    if (parent.classList.contains('layoutCard'))
        type = 'layout';
    if (parent.classList.contains('turnArea'))
        type = 'turnArea';
    if (parent.classList.contains('aceArea'))
        type = 'aceArea';
    switch (type) {
    case "deck":
        await deckAreaClick(duration);
        break;
    case "turnArea":
        turnAreaClick(target, parent, duration);
        break;
    case "layout":
        layoutAreaClick(target, parent, duration);
        break;
    case "aceArea":
        aceAreaClick(target, parent, duration);
        break;
    }
    isGameOver().then(handleGameOver);
}
function addToUndoList(card, fromArea, toArea, fromOffset, toOffset, turn, _duration) {
    if (ignoreUndo != 0)
        return;
    let item = {};
    item.cardId = card.id;
    item.fromAreaId = fromArea.id;
    item.toAreaId = toArea.id;
    item.fromOffset = fromOffset;
    item.toOffset = toOffset;
    item.turn = turn;
    item.duration = _duration;
    undoList[undoList.length - 1].unshift(item);
}
async function undo() {
    if (undoList.length == 0)
        return;
    let undoItems = Object.assign([], undoList[undoList.length - 1]);
    undoItems.sort(function(a, b) {
        // play back as close to possible
        if (a.toAreaId != b.toAreaId)
            return 0;
        if (document.getElementById(a.toAreaId).classList.contains('turnArea') || document.getElementById(b.toAreaId).classList.contains('turnArea'))
            return 0;
        if (parseInt(document.getElementById(a.cardId).dataset.number) < parseInt(document.getElementById(b.cardId).dataset.number))
            return 1;
        return -1;
    });
    for (let undoItem of undoItems) {
        let card = document.getElementById(undoItem.cardId);
        let toArea = document.getElementById(undoItem.fromAreaId);
        card.remove();
        toArea.appendChild(card);
        await animateMovement(card, undoItem.toOffset, undoItem.fromOffset, undoItem.turn, undoItem.duration);
    }
    undoList.pop();
    return true;
}
function canCardPlayOnAces(card) {
    let num = parseInt(card.dataset.number);
    let type = card.dataset.cardtype;
    let aces = document.getElementsByClassName('aceArea');
    for (let ace of aces) {
        let fc = ace.lastChild;
        if (!fc && num == 0)
            return ace;
        if (!fc)
            continue;
        if (parseInt(fc.dataset.number) + 1 == num && fc.dataset.cardtype == type)
            return ace;
    }
    return false;
}
function canCardPlayOnLayout(card) {
    let num = card.dataset.number;
    let color = card.dataset.color;
    let layouts = document.getElementsByClassName('layoutCard');
    for (let layout of layouts) {
        let fc = layout.lastChild;
        if (!fc && num == 12) {
            // can move king to vacant layout
            if (card.parentNode.classList.contains('layoutCard') == false)
                return layout;
            if (card.previousSibling || card.parentNode.id > layout.id)
                return layout;
            return false;
        }
        if (!fc)
            continue;
        if (parseInt(fc.dataset.number) - 1 == num && fc.dataset.color != color)
            return layout;
    }
    return false;
}
function canCardCauseLayoutMove(card) {
    let num = card.dataset.number;
    let color = card.dataset.color;
    let layouts = document.getElementsByClassName('layoutCard');
    for (let layout of layouts) {
        let ups = Array.from(layout.getElementsByClassName('up'));
        if (ups.length == 0)
            continue;
        let fc = ups[0];
        if (parseInt(fc.dataset.number) - 1 == num && fc.dataset.color != color)
            return layout;
    }
    return false;
}
async function moveCards(listOfCards, fromArea, toArea, _duration) {
    function moveCard(card, fromArea, toArea, offset, turn, _duration) {
        let toOffset = {
            x: toArea.offsetLeft + offset.x,
            y: toArea.offsetTop + offset.y
        };
        let fromOffset = {
            x: card.offsetLeft,
            y: card.offsetTop
        };
        //		card.remove();
        //		toArea.appendChild(card);
        addToUndoList(card, fromArea, toArea, fromOffset, toOffset, turn, _duration);
        return animateMovement(card, fromOffset, toOffset, turn, _duration);
    }
    let promises = [];
    let turn = false;
    let offset = {
        x: 0,
        y: 0
    };
    let toId = toArea.id.substr(0, 1);
    let fromId = fromArea.id.substr(0, 1);
    let lastChild = toArea.lastChild || toArea;
    let delta = toArea.clientHeight * 0.2;
    if (toId == 't')
        offset.x -= delta;
    if (toId == 'l')
        offset.y = lastChild.offsetTop - toArea.offsetTop;
    for (let card of listOfCards) {
        card.remove();
        toArea.append(card);
        if (toId == 'l')
            offset.y += card.dataset.number != 12 ? delta : 0;
        if (toId == 't') {
            offset.x += delta;
            turn = true;
        }
        if (toId == 'd')
            turn = true;
        promises.push(moveCard(card, fromArea, toArea, offset, turn, _duration));
        if (listOfCards.length > 1 && _duration != 0 && toId != 'd')
            await delay(_duration * 0.3 / 1000);
    }
    await Promise.all(promises);
    if (fromId == "l") {
        let lastChild = fromArea.lastChild;
        if (lastChild && lastChild.classList.contains('down')) {
            await moveCard(lastChild, fromArea, fromArea, {
                x: 0,
                y: lastChild.offsetTop - fromArea.offsetTop
            }, true, _duration);
        }
    }
}
async function aceAreaClick(card, parent, _duration) {
    let layout_area = canCardPlayOnLayout(card);
    if (layout_area) {
        await moveCards([card], parent, layout_area, _duration);
        return true;
    }
}
async function layoutAreaClick(card, parent, _duration) {
    let ups = Array.from(parent.getElementsByClassName('up'));
    let lastCard = ups[ups.length - 1];
    let aceArea = canCardPlayOnAces(lastCard);
    if (aceArea) {
        await moveCards([lastCard], parent, aceArea, _duration);
        return true;
    }
    let firstCard = ups[0];
    let layout_area = canCardPlayOnLayout(firstCard);
    if (layout_area) {
        await moveCards(ups, parent, layout_area, _duration);
        return true;
    }
    layout_area = canCardPlayOnLayout(card);
    if (layout_area) {
        while (ups[0].dataset.number != card.dataset.number)
            ups.shift();
        await moveCards(ups, parent, layout_area, _duration);
        return true;
    }

}
async function turnAreaClick(child, parent, _duration) {
    let card = parent.lastChild;
    let ace_area = canCardPlayOnAces(card);
    if (ace_area) {
        await moveCards([card], parent, ace_area, _duration);
        return true;
    }
    let layout_area = canCardPlayOnLayout(card);
    if (layout_area) {
        await moveCards([card], parent, layout_area, _duration);
        return true;
    }
}
async function deckAreaClick(_duration) {
    let deckArea = document.querySelector("#deckArea");
    let turnArea = document.querySelector("#turnArea");
    let deckCards = Array.from(document.querySelectorAll("#deckArea .card"));
    let turnCards = Array.from(document.querySelectorAll('#turnArea .card'));

    if (deckCards.length == 0 && turnCards.length != 0) {
		if (numberOfTurns<numberOfTurnsAllowed) {
			await moveCards(turnCards, turnArea, deckArea, _duration / 6);
			numberOfTurns++;
			return true;
		}
		else {
			return false;
		}
    }
    for (let card of turnCards) {
        card.style.left = '';
    }
    if (deckCards.length == 0)
        return false;
    await moveCards(deckCards.splice(0, numberOfTurnCards), deckArea, turnArea, _duration);
    return true;
}
function delay(seconds) {
    return new Promise(resolve=>setTimeout(resolve, seconds * 1000));
}
function animateMovement(element, from, to, flip, _duration, callback) {
    return new Promise((resolve)=>{
        function measure(time) {
            let deltaX = 0;
            let delta = _duration ? (time - prev) / _duration : 1;
            if (delta > 1)
                delta = 1;
            let deg = parseInt(180 * delta);

            if (!flipDone && flip && deg > 90) {
                flipDone = true;
                let up = element.classList.contains('up');
                if (up) {
                    element.classList.remove('up');
                    element.classList.add('down');
                } else {
                    element.classList.remove('down');
                    element.classList.add('up');
                }
            }
            if (flip) {
                if (flipDone) {
                    let fdeg = 180 - deg;
                    deltaX = offset.x * (1 - delta);
                    element.style.transform = `rotateY(${fdeg}deg)`;
                } else {
                    deltaX = offset.x * delta;
                    element.style.transform = `rotateY(${deg}deg)`;
                }
            }
            element.style.left = from.x + (to.x - from.x) * delta + deltaX + 'px';
            element.style.top = (from.y + (to.y - from.y) * delta) + 'px';
            if (delta != 1)
                requestAnimationFrame(measure);
            else {
                animationCounter--;
                element.style.transformOrigin = '';
                element.style.left = to.x + "px";
                element.style.top = to.y + "px";
                element.style.transform = '';
                element.style.zIndex = '';
                let front = element.getElementsByClassName('front')[0];
                if (front)
                    front.style.transform = '';
                if (callback)
                    callback(element);
                resolve(true);
            }
        }
        let prev = performance.now();
        let flipDone = false;
        let offset = {
            x: 0,
            y: 0
        };
        if (ignoreUndo == 0) {
            currentScore = document.querySelectorAll('.turnArea  ~ .playAreaCard .card').length * 5;
            document.getElementById('currentScore').innerHTML = currentScore;
            currentVegasScore = lastVegasScore + currentScore;
            document.getElementById('totalScore').innerHTML = currentVegasScore;
        }
        animationCounter++;
        if (flip)
            offset.x = element.clientWidth * element.style.scale;
        element.style.zIndex = 100;
        if (_duration)
            requestAnimationFrame(measure);
        else
            measure(prev);
    }
    );
}
function animateFinish(x_origin, y_origin, callback) {
    return new Promise((resolve)=>{
        function animate(element, duration, callback) {
            /**
			 * Calculates the angle (in radians) between two vectors pointing outward from one center
			 *
			 * @param p0 first point
			 * @param p1 second point
			 * @param c center point
			 */
            function calculateAngles(pointA, pointB, pointC) {
                // Helper function to calculate distance between two points
                const distance = (x1,y1,x2,y2)=>Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

                // Calculate side lengths
                const a = distance(pointB[0], pointB[1], pointC[0], pointC[1]);
                const b = distance(pointA[0], pointA[1], pointC[0], pointC[1]);
                const c = distance(pointA[0], pointA[1], pointB[0], pointB[1]);

                // Calculate angles using Law of Cosines and Law of Sines
                const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI);
                const angleB = Math.asin(b * Math.sin(angleA * Math.PI / 180) / a) * (180 / Math.PI);
                const angleC = 180 - angleA - angleB;

                return [angleA, angleB, angleC];
            }

            function measure(time) {
                let delta = (time - prev) / duration;
                if (delta > 1)
                    delta = 1;
                //let newRadius = radius*(1-delta);
                let degrees = parseInt(360 * delta) * 5 + startAngle;
                if (degrees > 360)
                    degrees -= 360;
                degrees = degrees * Math.PI / 180;
                let x_oncircle = Math.cos(degrees) * 1.4142 * eWidth * (1 - delta) + x_origin;
                let y_oncircle = Math.sin(degrees) * 1.4142 * eHeight * (1 - delta) + y_origin;
                //let x_oncircle = x_origin + newRadius * Math.cos (degrees * Math.PI / 180);
                //let y_oncircle = y_origin + newRadius * Math.sin (degrees * Math.PI / 180);
                element.style.left = x_oncircle + 'px';
                element.style.top = y_oncircle + 'px';
                if (delta != 1)
                    requestAnimationFrame(measure);
                else {
                    if (callback)
                        callback(element);
                }
            }
            let prev = performance.now();
            let eWidth = (window.innerWidth) / 2;
            let eHeight = y_origin - element.offsetTop;
            let startAngle = calculateAngles([element.offsetLeft, element.offsetTop], [x_origin, 0], [x_origin, y_origin])[2];
            startAngle += 180;
            requestAnimationFrame(measure);
        }
        async function startCard() {
            let card = cards[i];
            if (i != cards.length - 1)
                animate(card, 5000, callback);
            else {
                await animate(card, 5000, callback);
                resolve(true);
                clearInterval(interval);
            }
            i++;
        }
        let cards = document.getElementsByClassName("card");
        let i = 0;
        let interval = setInterval(startCard, 100);
    }
    );
}
function showGameOverDialog() {
    gameOver = true;
    document.getElementById("gameOverScore").innerHTML = currentScore;
    document.getElementById("gameOverAIScore").innerHTML = AIScore * 5;
    document.getElementById("gameOverReplayButton").addEventListener('click', function() {
        replayHand();
        document.getElementById("gameOverDialog").close();
    });
    document.getElementById("gameOverCommentButton").addEventListener('click', function() {
        showCommentDialog();
    });
    document.getElementById("gameOverAutoButton").addEventListener('click', function() {
        autoPlay(duration).then(()=>{
            document.getElementById("gameOverDialog").close();
        }
        );
    });
    document.getElementById("gameOverCancelButton").addEventListener('click', function() {
        document.getElementById("gameOverDialog").close();
    });
    document.getElementById("gameOverDialog").showModal();
}
function showCommentDialog() {
	document.getElementById("commentMessage").value='';
    document.getElementById("commentCancelButton").addEventListener('click', function() {
        document.getElementById("commentDialog").close();
    });
    document.getElementById("commentOKButton").addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		let name 	= document.getElementById("commentName").value
		let email	= document.getElementById("commentEMail").value
		let message = document.getElementById("commentMessage").value;
		if (!name) {
			alert("Some identifier name must be provided");
			return;
		}
		if (!message) {
			alert("Some message must be provided");
			return;
		}
		var blob = new Blob([JSON.stringify(deck)], { type: 'text/plain' });
		var file = new File([blob], "deck.txt", {type: "text/plain"});
		var data = new FormData();
		data.append('name',name);
		data.append('email',email);
		data.append('message',message);
		data.append('numberOfTurnCards',numberOfTurnCards);
		data.append('numberOfTurnsAllowed',numberOfTurnsAllowed);
		data.append('duration',duration);
		data.append('deck',file);
		fetch("scripts/emailComment.php"+'?a='+Date.now(), { // Your POST endpoint
			method: 'POST',
			body: data // This is your file object
		  }).then((rc)=>{
			console.log("comment sent with rc = "+rc.statusText); 
			document.getElementById("commentDialog").close();
		  });
    });
	document.getElementById("commentDialog").showModal();
}
function showOptionsDialog() {
 	function setOption(id,dataID,value) {
		let selector = document.getElementById(id);
		let selectedValue = selector.querySelector(".selected-value");
		let li = selector.querySelector(`[data-${dataID}="${value}"]`);
		if (!li) li = selector.querySelector('li');
		selectedValue.innerHTML=li.querySelector('label').innerHTML;
		selector.querySelectorAll('li').forEach(op => {op.classList.remove('active')});
		li.classList.add('active');
	}
	function getOption(id,dataID) {
		let selector = document.getElementById(id);
		let selectedValue = selector.querySelector(".selected-value");
		//selector.querySelector('[data-color="#5555ff,white"]')
		let li = selector.querySelector(`li.active`);
		if (li) return li.dataset[dataID];
		else {
			li = selector.querySelector('li')
			li.classList.add('active');
			return li.dataset[dataID];
		}
	}
	setOption('optionsColor','color',colorSplit.join(","));
	setOption('optionsTurnRate','number',numberOfTurnCards);
	setOption('optionsSpeed','speed',duration);
	setOption('optionsNumberTurn','number',numberOfTurnsAllowed);
	document.getElementById("optionsOKButton").addEventListener('click', function() {
        duration = getOption('optionsSpeed','speed');
        numberOfTurnCards = getOption('optionsTurnRate','number');
		numberOfTurnsAllowed = getOption('optionsNumberTurn','number');
		colorSplit = getOption('optionsColor','color').split(',');
		backgroundColor= colorSplit[0];
		document.body.style.backgroundColor = backgroundColor;
		document.querySelector('.score').style.color = colorSplit[1];
		document.querySelector('.footer').style.color = colorSplit[1];
        localStorage.setItem('duration', duration);
        localStorage.setItem('numberOfTurnCards', parseInt(numberOfTurnCards));
        localStorage.setItem('theme', colorSplit.join(','));
		localStorage.setItem('numberOfTurnsAllowed',numberOfTurnsAllowed);
        document.getElementById("optionsDialog").close();
		replayHand();
    });
    document.getElementById("optionsCancelButton").addEventListener('click', function() {
        document.getElementById("optionsDialog").close();
    });
    document.getElementById("optionsDialog").showModal();
}
async function autoPlay(_duration) {
    document.getElementById("gameOverDialog").close();
    await setupGameCards();
    let finished = await isGameOver(0);
    while (!finished) {
        await playACard(_duration);
        await delay(1);
        finished = await isGameOver(0);
    }
    return true;
}
async function replayHand() {
    currentVegasScore = lastVegasScore + 55;
    await setupGameCards();
}
async function finishGame(_duration) {
    let count = 0;
    let notFinished = true;
    while (notFinished) {
        count++;
        if (count > 200) {
            alert("error, report to developer");
            // got to be an error
            return false;
        }
        notFinished = await playACard(_duration, true);
        //console.log(`last move=${lastCardPlayed.num},${lastCardPlayed.color},${lastCardPlayed.type} from:${lastCardPlayed.from.id}, to:${lastCardPlayed.to.id}`);
    }
    if (_duration) {
        while (animationCounter)
            await delay(0.1);
        isGameOver().then(handleGameOver);
    }
    return true;
}
async function testIfAutoComplete(_duration) {
    while (animationCounter)
        await delay(0.05);
    ignoreUndo++;
	let savednumberOfTurns = numberOfTurns;
    let clonedPlayArea = document.getElementById('gameArea').cloneNode(true);
    await finishGame(_duration);
    solverScore = document.querySelectorAll('.turnArea  ~ .playAreaCard .card').length;
    if (AIScore === false)
        AIScore = solverScore;
    // save for GameOver Dialog;
    let layoutCardCount = document.querySelectorAll('#layoutArea .card.up').length;
    //alert (playedCardCount);
    document.getElementById('gameArea').replaceWith(clonedPlayArea);
    addSolitareEvents();
    ignoreUndo--;
	numberOfTurns = savednumberOfTurns;
    return [solverScore, layoutCardCount];
}
async function isGameOver() {
    let playedCardCount = document.querySelectorAll('.turnArea  ~ .playAreaCard .card').length;
    let turnCardCount = document.querySelectorAll('.turnArea .card').length;
    let layoutCardCount = document.querySelectorAll('#layoutArea .card.up').length;
    let[count,layout] = await testIfAutoComplete(0);
    if (!(count == playedCardCount && layout == layoutCardCount))
        return false;
    if (count == 52 && turnCardCount == 0 && layoutCardCount != 0)
        return "autoPlay";
    if (count == 52 && layout == 0)
        return "win";
    if (count == playedCardCount && layout == layoutCardCount)
        return 'over';
    return false;
}
async function runSimulation() {
    let totalScore = 0;
    let totalWins = 0;
    simulation = true;
    let i;
    document.getElementById('gameArea').style.display = "none";
    for (i = 0; i < 1000; i++) {
        generateCards();
        setupGameCards();
        await finishGame(0);
        let playedCardCount = document.querySelectorAll('.turnArea  ~ .playAreaCard .card').length;
        if (playedCardCount == 52)
            totalWins++;
        totalScore += playedCardCount;
        console.log(`interation=${i + 1}, current=${playedCardCount}, total=${totalScore}, average=${totalScore / (i + 1)}`);
        await delay(0.01);
        // allow for garbage collection?
        //debugger;
    }
    simulation = false;
    document.getElementById('gameArea').style.display = "block";
    alert(`Average played cards after ${i} hands is ${totalScore / i}, total wins=${totalWins * 100 / i}%`);
}
async function playACard(_duration, inFinish) {
    async function playLayoutToLayoutCard() {
        for (let layout of layouts) {
            let ups = Array.from(layout.getElementsByClassName('up'));
            if (ups.length == 0)
                continue;
            let card = ups[0];
            if (parseInt(card.dataset.number) == 0)
                continue;
            // aces get moved later
            let playLayoutArea = canCardPlayOnLayout(card);
            if (playLayoutArea) {
                await moveCards(ups, layout, playLayoutArea, _duration);
                return true;
            }
        }
        return false;
    }
    async function playLayoutToAcesCard() {
        for (let layout of layouts) {
            let ups = Array.from(layout.getElementsByClassName('up'));
            if (ups.length == 0)
                continue;
            let card = ups[ups.length - 1];
            let aceArea = canCardPlayOnAces(card);
            if (aceArea) {
                await moveCards([card], layout, aceArea, _duration);
                return true;
            }
        }
        return false;
    }
    async function playTurnCards() {
        async function turnDeck() {
            let deckArea = document.querySelector("#deckArea");
            let turnArea = document.querySelector("#turnArea");
            if (document.querySelectorAll('#deckArea .card').length == 0) {
                deckEmpty++;
                let turnCards = Array.from(document.querySelectorAll('#turnArea .card'));
                if (turnCards.length == 0) {
                    deckEmpty = 2;
                    return false;
                }
				if (numberOfTurns < numberOfTurnsAllowed) {
					numberOfTurns++;
					await moveCards(turnCards, turnArea, deckArea, _duration / 6);
					return true;
				}
				else return false;
            }
            let deckCards = Array.from(document.querySelectorAll('#deckArea .card'));
            let turnCards = Array.from(document.querySelectorAll('#turnArea .card'));
            if (deckCards.length == 0)
                return false;
            for (let card of turnCards) {
                card.style.left = '';
            }
            await moveCards(deckCards.splice(0, numberOfTurnCards), deckArea, turnArea, _duration);
            if (_duration)
                await delay(_duration / 2000);
            return true;
        }
        let deckEmpty = 0;
        topTurnCards = [];
        while (deckEmpty != 2) {
            if (document.querySelectorAll('.turnArea .card').length == 0) {
                if (!await turnDeck())
                    return false;
            }
            let card = document.getElementById("turnArea").lastChild;
            if (!card)
                debugger ;topTurnCards.push(card);
            let playLayoutArea = canCardPlayOnLayout(card);
            if (playLayoutArea && parseInt(card.dataset.number) != 0) {
                await moveCards([card], card.parentNode, playLayoutArea, _duration);
                return true;
            }
            let aceArea = canCardPlayOnAces(card);
            if (aceArea) {
                await moveCards([card], card.parentNode, aceArea, _duration);
                return true;
            }
            if (!await turnDeck())
                return false;
        }
        return false;
    }
    async function moveLayoutCardToBeAbleToPlayOnAces() {
        for (let layout of layouts) {
            let ups = Array.from(layout.getElementsByClassName('up'));
            if (ups.length == 0)
                continue;
            for (let card of ups) {
                let playLayoutArea = canCardPlayOnLayout(card);
                if (!playLayoutArea || playLayoutArea == layout)
                    continue;
                let potential = card.previousSibling;
                if (!potential)
                    continue;
                let aceArea = canCardPlayOnAces(potential);
                if (aceArea) {
                    while (ups[0].dataset.number != card.dataset.number)
                        ups.shift();
                    await moveCards(ups, layout, playLayoutArea, _duration);
                    return true;
                }
            }
        }
        return false;
    }
    async function moveAceCardToLayoutToTurnHiddenLayoutCard() {
        for (let ace of aces) {
            let card = ace.lastCard;
            if (!card)
                continue;
            let playLayoutArea = canCardPlayOnLayout(card);
            if (playLayoutArea) {
                for (let layout of layouts) {
                    let ups = Array.from(layout.getElementsByClassName('up'));
                    if (ups.length == 0)
                        continue;
                    let topCard = ups[0];
                    if (parseInt(card.dataset.number) - 1 == parseInt(topCard.dataset.number) && card.dataset.color != topCard.dataset.color) {
                        await moveCards([card], ace, playLayoutArea, _duration);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    async function moveAceCardToLayoutToPlayTurnCard() {
        for (let ace of aces) {
            let card = ace.lastCard;
            if (!card)
                continue;
            let playLayoutArea = canCardPlayOnLayout(card);
            if (playLayoutArea) {
                for (let turnCard of topTurnCards) {
                    if (parseInt(turnCard.dataset.number) == parseInt(card.dataset.number) - 1 && turnCard.dataset.color != card.dataset.color) {
                        if (canCardCauseLayoutMove(turnCard)) {
                            await moveCards([card], ace, playLayoutArea, _duration);
                            playTurnCards();
                            return true;
                        }
                    }
                }

            }
        }
        return false;
    }

    let rc = false;
    let topTurnCards;
    if (_duration) {
        while (animationCounter)
            await delay(0.1);
    }
    if (ignoreUndo == 0)
        undoList.push([]);
    let layouts = Array.from(document.getElementsByClassName('layoutCard')).reverse();
    let aces = Array.from(document.querySelectorAll('.aceArea'));
    rc = await playLayoutToLayoutCard();
    if (!rc)
        rc = await playLayoutToAcesCard();
    if (!rc)
        rc = await playTurnCards();
    if (!rc)
        rc = await moveLayoutCardToBeAbleToPlayOnAces();
    if (!rc)
        rc = await moveAceCardToLayoutToTurnHiddenLayoutCard();
    ;if (!rc)
        rc = await moveAceCardToLayoutToPlayTurnCard()
    if (_duration != 0 && inFinish !== true)
        isGameOver().then(handleGameOver);
    return rc;
}
function startNewGame() {
    generateCards();
    setupGameCards();
}
function setupOptionsSelect() {
	const customSelects = document.querySelectorAll(".custom-select")
	for (let customSelect of customSelects) {
		let selectBtn = customSelect.querySelector(".select-button");
		let selectedValue = customSelect.querySelector(".selected-value");
		let optionsList = customSelect.querySelectorAll(".select-dropdown li");
		selectBtn.addEventListener("click", () => {
			// add/remove active class on the container element
			customSelect.classList.toggle("active");
			// update the aria-expanded attribute based on the current state
			selectBtn.setAttribute("aria-expanded", selectBtn.getAttribute("aria-expanded") === "true" ? "false" : "true");
		});
		optionsList.forEach(option => {
			function handler(e) {
				// Click Events
				e.preventDefault();
				if(e.type === "click" && e.clientX !== 0 && e.clientY !== 0) {
					selectedValue.innerHTML = this.children[1].innerHTML;
					customSelect.classList.remove("active");
					optionsList.forEach(op => {op.classList.remove('active')});
					option.classList.add('active');
				}
				// Key Events
				if(e.key === "Enter") {
					selectedValue.innerHTML = this.children[1].innerHTML;
					customSelect.classList.remove("active");
					optionsList.forEach(op => {op.classList.remove('active')});
					option.classList.add('active');
				}
			}
			option.addEventListener("keyup", handler);
			option.addEventListener("click", handler);
		});
	}
}
async function docLoaded() {
    duration = localStorage.getItem('duration') || 1000;
    numberOfTurnCards = parseInt(localStorage.getItem('numberOfTurnCards')) || 3;
    numberOfTurnsAllowed = parseInt(localStorage.getItem('numberOfTurnsAllowed')) || 2000;
	colorSplit = (localStorage.getItem('theme') || '#adff2f,black').split(',');
	backgroundColor= colorSplit[0];
	document.body.style.backgroundColor = backgroundColor;
	document.querySelector('.score').style.color = colorSplit[1];
	document.querySelector('.footer').style.color = colorSplit[1];
    generateCards();
    await setupGameCards();
	setupOptionsSelect()
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    document.querySelector("[data-menu='newgame']").addEventListener('click', (()=>startNewGame(duration)));
    document.querySelector("[data-menu='undo']").addEventListener('click', undo);
    document.querySelector("[data-menu='playcard']").addEventListener('click', (()=>playACard(duration)));
    document.querySelector("[data-menu='finish']").addEventListener('click', (()=>finishGame(duration)));
    document.querySelector("[data-menu='rewind']").addEventListener('click', (()=>replayHand(duration)));
    document.querySelector("[data-menu='options']").addEventListener('click', showOptionsDialog);
    document.addEventListener("keydown", async(event)=>{
        if (animationCounter)
            return;
		for (let d of document.querySelectorAll('dialog')) {if (d.open) return;};
        const keyName = event.key;
        if (keyName == 'p')
            await playACard(duration);
        if (keyName == 'f')
            finishGame(0);
        if (keyName == 'r')
            replayHand();
        if (keyName == 't')
            testCode();
        if (keyName == 's')
            runSimulation();
        if (keyName == 'a')
            autoPlay();
        if (keyName == 'u')
            await undo();
    }
    , false, );
}
window.addEventListener('load', docLoaded);
