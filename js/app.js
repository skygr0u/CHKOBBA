String.prototype.format = function() {
    var tmp = this.toString();
    for (var i = 0; i < arguments.length; i++) {
        tmp = tmp.split(`{${i}}`).join(arguments[i]);
    }
    return tmp;
}

function get_generator(property, default_value) {
    return function() {
        return localStorage[property] || default_value;
    }
}

function set_generator(property) {
    return function(value) {
        localStorage[property] = value;
    }
}

function get_and_check_generator(property, allowed_values, default_value) {
    if (Array.isArray(allowed_values))
        return function() {
            if (allowed_values.indexOf(localStorage[property]) > -1)
                return localStorage[property];
            else
                return default_value;
        }
    else
        return function() {
            if (allowed_values.hasOwnProperty(localStorage[property]))
                return localStorage[property];
            else
                return default_value;
        }
}

function check_and_set_generator(property, allowed_values) {
    if (Array.isArray(allowed_values))
        return function(value) {
            if (allowed_values.indexOf(value) > -1)
                localStorage[property] = value;
        }
    else
        return function(value) {
            if (allowed_values.hasOwnProperty(value))
                localStorage[property] = value;
        }
}
//-------------------------Select Cards------------------------------------//
var global_variables = {
    types_of_cards: {
        Poker_figures: { number: 40, w: 386, h: 560 },
    },
    suits: "dcbs",
    notifications_duration: 5,
    animation_duration: {
        slow: 1.5,
        medium: 1,
        fast: 0.7
    }
}

var properties = {
    cards: {
        get: get_and_check_generator("cards", global_variables.types_of_cards, "Poker_figures"),
        //set: check_and_set_generator("cards", global_variables.types_of_cards)
    },
    background: {
        get: get_generator("background", "data/backgrounds/green.png"),
        set: set_generator("background")
    },
    username: {
        get: get_generator("username", "Player"),
        set: set_generator("username")
    },
    variant: {
        get: get_generator("variant", "Classic Scopa"),

    },
    number_of_players: {
        get: get_generator("number_of_players", "2"),
        set: set_generator("number_of_players")
    },

    speed: {
        get: get_and_check_generator("speed", ["slow", "medium", "fast"], "medium"),
        set: check_and_set_generator("speed", ["slow", "medium", "fast"])
    },
}

var settings = {};
Object.defineProperties(settings, properties);
for (key in global_variables) {
    Object.defineProperty(settings, key, { value: global_variables[key], writable: false });
}

GraphicsManager = function(cardsType) {
    this.loadCardsLocked = false;
    this.loadedCards = 0;
    this.onLoad = null;
    this.canvasCache = {};

    this.ch = settings.types_of_cards[cardsType].h;
    this.cw = settings.types_of_cards[cardsType].w;
    
    if (cardsType) this.setCardsType("Poker_figures");
    else this.setCardsType("Poker_figures")
}

GraphicsManager.prototype.updateCardImg = function(img, card, hide) {
    if (hide) {
        card.suit = 0;
        card.value = 0;
    }
    img.dataset.card = `${card.value}${this.suits[card.suit]}`;
    if (card.new_value) img.dataset.new_value = card.new_value;

    this.drawCardImg(img);
}

GraphicsManager.prototype.drawCardImg = function(img) {
    if (img.dataset.new_value) {
        var canvas = document.createElement("canvas");

        canvas.width = this.cw;
        canvas.height = this.ch;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(this.canvasCache[img.dataset.card],
            0, 0, this.cw, this.ch,
            0, 0, this.cw, this.ch);

        var m = Math.floor(this.cw / 10);
        var s = Math.floor(this.ch / 8);

        ctx.font = `${s}px serif`;
        var text = ctx.measureText(img.dataset.new_value);
        ctx.fillStyle = "red";
        ctx.fillRect(canvas.width - text.width - 2 * m, 0, text.width + 2 * m, s + 2 * m);
        ctx.fillStyle = "black";
        ctx.fillText(img.dataset.new_value, canvas.width - text.width - m, s + m);

        img.src = canvas.toDataURL();
    } else {
        img.src = this.canvasCache[img.dataset.card].toDataURL();
    }
}

GraphicsManager.prototype.updateDeckImg = function(img, cards) {
    img.dataset.length = cards.length;
    img.dataset.sideCardsLength = cards.side_cards.length;

    var card = cards.side_cards[0];
    for (var i = 0; i < cards.side_cards.length; i++) {
        if (cards.side_cards[i])
            card = cards.side_cards[i];
    }
    if (card) img.dataset.sideCard = `${card.value}${this.suits[card.suit]}`;

    this.drawDeckImg(img);
}

GraphicsManager.prototype.drawDeckImg = function(img) {
    var numberOfCards = Math.ceil(parseInt(img.dataset.length) / 4);

    var canvas = document.createElement("canvas");
    canvas.width = 2 * this.cw;
    canvas.height = this.ch + 20;

    var ctx = canvas.getContext("2d");

    if (img.dataset.sideCardsLength > 0) {
        if (img.dataset.sideCard) {
            ctx.drawImage(this.canvasCache[img.dataset.sideCard],
                0, 0, this.cw, this.ch,
                this.cw, 0, this.cw, this.ch);
        }

        var m = Math.floor(this.cw / 10);
        var s = Math.floor(this.ch / 8);

        ctx.font = `${s}px serif`;
        var text = ctx.measureText(img.dataset.sideCardsLength);
        ctx.fillStyle = "black";
        ctx.fillRect(canvas.width - text.width - 2 * m, 0, text.width + 2 * m, s + 2 * m);
        ctx.fillStyle = "white";
        ctx.fillText(img.dataset.sideCardsLength, canvas.width - text.width - m, s + m);
    }

    for (var i = 0; i < numberOfCards; i++) {
        ctx.drawImage(this.canvasCache[`0${this.suits[0]}`],
            0, 0, this.cw, this.ch,
            i, i, this.cw, this.ch);
    }

    img.src = canvas.toDataURL();
}

GraphicsManager.prototype.updateCanvasCache = function(onLoad) {
    if (this.loadCardsLocked) return;

    this.loadCardsLocked = true;
    this.loadedCards = 0;
    this.onLoad = onLoad;

    var manager = this;

    var resize = function(image, suit, value) {
        var canvas = document.createElement("canvas");
        var tmp = document.createElement("canvas");

        canvas.width = manager.cw;
        canvas.height = manager.ch;

        var n = 1;
        while (n * manager.cw < settings.types_of_cards[manager.cardsType].w)
            n = n * 2;

        tmp.width = manager.cw * n;
        tmp.height = manager.ch * n;
        tmpCtx = tmp.getContext("2d");

        tmpCtx.drawImage(image, 0, 0,
            settings.types_of_cards[manager.cardsType].w,
            settings.types_of_cards[manager.cardsType].h,
            0, 0,
            manager.cw * n,
            manager.ch * n);

        while (n > 1) {
            tmpCtx.drawImage(tmp, 0, 0,
                manager.cw * n,
                manager.ch * n,
                0, 0,
                manager.cw * (n / 2),
                manager.ch * (n / 2));
            n = n / 2;
        }

        var ctx = canvas.getContext("2d");

        //round corners
        var r = Math.floor(manager.cw / 8);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(manager.cw - r, 0);
        ctx.arc(manager.cw - r, r, r, -Math.PI / 2, 0, false);
        ctx.lineTo(manager.cw, manager.ch - r);
        ctx.arc(manager.cw - r, manager.ch - r, r, 0, Math.PI / 2, false);
        ctx.lineTo(r, manager.ch);
        ctx.arc(r, manager.ch - r, r, Math.PI / 2, Math.PI, false);
        ctx.lineTo(0, r);
        ctx.arc(r, r, r, -Math.PI, -Math.PI / 2, false);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(tmp, 0, 0,
            manager.cw,
            manager.ch,
            0, 0,
            manager.cw,
            manager.ch);

        //value on cards
        

        manager.canvasCache[`${value}${manager.suits[suit]}`] = canvas;

        manager.loadedCards += 1;
        if (manager.loadedCards == settings.types_of_cards[manager.cardsType].number + 1) {
            if (manager.onLoad) manager.onLoad();
            manager.loadCardsLocked = false;
            manager.onLoad = null;
        }
    }

    var img = new Image();

    img.onload = function() {
        resize(this, 0, 0);
    }

    img.src = `data/cards/${this.cardsType}/bg.jpg`;

    for (var suit = 0; suit < 4; suit++) {
        for (var value = 0; value < 11; value++) {
            var img = new Image();

            img.onload = (function(suit, value) {
                return function() { resize(this, suit, value) }
            })(suit, value);

            img.src = `data/cards/${this.cardsType}/${value}${settings.suits[suit]}.jpg`;
        }
    }
}

GraphicsManager.prototype.updateCards = function() {
    var manager = this;

    this.updateCanvasCache(function() {
        var fixedCards = document.querySelectorAll(".fixedCard");
        for (var i = 0; i < fixedCards.length; i++) manager.drawCardImg(fixedCards[i]);

        fixedCards = document.querySelectorAll(".fixedDeck");
        for (var i = 0; i < fixedCards.length; i++) manager.drawDeckImg(fixedCards[i]);
    });
}

GraphicsManager.prototype.setCardHeight = function(height) {
    this.ch = Math.floor(height);
    this.cw = Math.floor(settings.types_of_cards[this.cardsType].w * this.ch / settings.types_of_cards[this.cardsType].h);

    this.updateCards();
}

GraphicsManager.prototype.setCardWidth = function(width) {
    this.cw = Math.floor(width);
    this.ch = Math.floor(settings.types_of_cards[this.cardsType].h * this.cw / settings.types_of_cards[this.cardsType].w);

    this.updateCards();
}

GraphicsManager.prototype.setCardsType = function(cardsType) {
    this.cardsType = cardsType;

    this.setCardHeight(this.ch); //FIXME

    if (settings.types_of_cards[cardsType].number == 40) this.suits = "dcbs";

    this.updateCards();
}

ScopaApplication = function() {
    this.variants = [];
    this.match = null;

    this.matchTeams = null;
    this.localPlayer = null;

    this.graphicsManager = new GraphicsManager(settings.cards);
    this.graphicsManager = new GraphicsManager("Poker_figures");

    this.resizeLock = false;
    this.resizeRequested = true;

    this.userCanPlay = false;
    this.playedCard = null;

    //load settings
    document.body.style.backgroundImage = `url(${settings.background})`;
    document.getElementById("userName").value = settings.username;


    document.getElementById(settings.speed).selected = true;


    //add event listeners
    var app = this;

    var backgroundPreviews = document.querySelectorAll(".backgroundPreview");

    for (var i = 0; i < backgroundPreviews.length; i++) {
        backgroundPreviews[i].addEventListener("click", function(evt) {
            document.body.style.backgroundImage = `url(${evt.target.src})`;
            settings.background = evt.target.src;
        });
    }

    document.querySelector("#speed").addEventListener("change", function() {
        settings.speed = document.querySelector("#speed").selectedOptions[0].id;
    });



    var menu = document.querySelector("#menu");

    document.querySelector("#menu-btn").addEventListener("click", function() {
        if (menu.hidden == false) menu.hidden = true;
        else menu.hidden = false;
    });

    //menu items
    var items = document.querySelectorAll("#menu > label");
    for (var i = 0; i < items.length; i++) {
        if (items[i].dataset.dialog) {
            items[i].addEventListener("click", function(event) {
                app.showDialog(event.target.dataset.dialog);
                menu.hidden = true;
            });
        }
    }

    //dialogs' close buttons//
    var buttons = document.querySelectorAll(".close");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function(event) {
            document.getElementById(event.target.dataset.dialog).hidden = true;
        });
    }

    //windows movements
    var titles = document.querySelectorAll(".titlebar > *:first-child");
    for (var i = 0; i < titles.length; i++) {
        titles[i].addEventListener("mousedown", function(event) {
            if (event.button == 0) {
                var dialog = event.target.parentNode.parentNode;
                dialog.style.top = `${dialog.offsetTop}px`;
                dialog.style.left = `${dialog.offsetLeft}px`;
                dialog.style.margin = "0px";
                dialog.style.position = "fixed";


                var mouseMoveHandler = function(evt) {
                    dialog.style.top = `${dialog.offsetTop+evt.movementY}px`;
                    dialog.style.left = `${dialog.offsetLeft+evt.movementX}px`;
                }

                window.addEventListener("mousemove", mouseMoveHandler);

                var endMove;
                endMove = function(evt) {
                    window.removeEventListener("mousemove", mouseMoveHandler);
                    window.removeEventListener("mouseup", endMove);
                }

                window.addEventListener("mouseup", endMove);
            }
        });
    }

    //buttons
    document.querySelector("#start-game").addEventListener("click", function() {
        app.onStartGame();
    });

    document.querySelector("#continue").addEventListener("click", function() {
        document.querySelector("#summary").hidden = true;
        var newResponse = app.match.send({ "command": "next" });
        app.analyze(newResponse);
    });

    document.querySelector("#match-end-close-btn").addEventListener("click", function() {
        var fixedCards = document.querySelectorAll(".fixedCard, .fixedDeck");

        for (var i = 0; i < fixedCards.length; i++) {
            document.body.removeChild(fixedCards[i]);
        }

        app.showDialog("new-game");
    });

    //window resize event
    window.addEventListener("resize", function() {
        app.onResize();
    });

    this.onResize();
}

ScopaApplication.prototype.registerGame = function(Game) {
    var game = new Game();

    var info = game.send({ "command": "info" }).infos[0];

    var number_of_players = [];

    for (var i = 0; i < info.number_of_players.length; i++)
        number_of_players.push(info.number_of_players[i][0] * info.number_of_players[i][1]);

    this.variants.push({
        "class": Game,
        "name": info.name,
        "number_of_players": number_of_players,
        "description": info.description
    });

    var variantSelect = document.querySelector("#variant");
    var option = document.createElement("option");
    option.dataset.index = this.variants.length - 1;
    option.textContent = info.name;
    variantSelect.appendChild(option);

    if (settings.variant == info.name) option.selected = true;
}

ScopaApplication.prototype.loadLocale = function(locale) {
    var labels = document.querySelectorAll("[data-string-id]");
    for (var i = 0; i < labels.length; i++) {
        if (locale[labels[i].dataset.stringId])
            labels[i].textContent = locale[labels[i].dataset.stringId];
    }

    labels = document.querySelectorAll("[data-string-prototype]");
    for (var i = 0; i < labels.length; i++) {
        if (locale[labels[i].dataset.stringPrototype])
            labels[i].textContent = locale[labels[i].dataset.stringPrototype];
    }
}

ScopaApplication.prototype.getLocaleString = function(stringId) {
    var proto = document.querySelector(`[data-string-prototype='${stringId}']`);
    if (proto)
        return proto.textContent;
    else
        return "";
}

ScopaApplication.prototype.updateNumberOfPlayers = function() {
    var variant = this.variants[document.querySelector("#variant").selectedOptions[0].dataset.index];
    var number_of_players = document.querySelector("#numberOfPlayers");
    while (number_of_players.firstChild) {
        number_of_players.removeChild(number_of_players.firstChild);
    }
    for (var i = 0; i < variant.number_of_players.length; i++) {
        var option = document.createElement("option");
        option.textContent = variant.number_of_players[i];
        option.id = "numberOfPlayers-" + variant.number_of_players[i];
        number_of_players.appendChild(option);
    }
    if (document.querySelector("#numberOfPlayers-" + settings.number_of_players)) {
        document.querySelector("#numberOfPlayers-" + settings.number_of_players).selected = true;
    }
}


ScopaApplication.prototype.showDialog = function(dialogId) {
    var dialogs = document.querySelectorAll(".dialog");
    for (var i = 0; i < dialogs.length; i++) {
        if (dialogs[i].id != dialogId) dialogs[i].hidden = true;
        else {
            //reset window's margin
            dialogs[i].querySelector(".window").style.margin = "calc(0.05 * var(--h))";
            dialogs[i].querySelector(".window").style.position = "static";

            dialogs[i].hidden = false;
        }
    }
}

ScopaApplication.prototype.displayMessage = function(stringId, string) {
    var messages = document.getElementById("messages");

    var message = document.createElement("label");
    message.dataset.stringId = stringId;
    message.textContent = string;
    var br = document.createElement("br");

    //update messages log
    var messagesLog = document.getElementById("messages-log");
    messagesLog.appendChild(message.cloneNode(true));
    messagesLog.appendChild(br.cloneNode(true));

    //display notification
    message.style.animation = `message ${settings.notifications_duration}s forwards`;

    message.addEventListener("animationend", function() {
        messages.removeChild(message);
        messages.removeChild(br);
    });

    messages.insertBefore(br, messages.firstChild);
    messages.insertBefore(message, messages.firstChild);
}

ScopaApplication.prototype.onResize = function(e) {
    if (!this.resizeLock && this.resizeRequested) {
        this.resizeLock = true;
        this.resizeRequested = false;
        var s = 50;

        var w = document.documentElement.clientWidth;
        var h = document.documentElement.clientHeight;

        var ch = Math.min(h / 4.5, settings.types_of_cards[settings.cards].h)
        this.graphicsManager.setCardHeight(ch);

        css = `:root {
                 --w: ${w}px;
                 --h: ${h}px;
                 --ch: ${this.graphicsManager.ch}px;
                 --cw: ${this.graphicsManager.cw}px;
                 --cn: 3;
                 --s: ${s}px;
             }`;

        document.querySelector("#root").innerHTML = css;

        //this.loadCards(settings.cards);

        var fixedCards = document.querySelectorAll(".fixedCard, .fixedDeck");

        for (var i = 0; i < fixedCards.length; i++) {
            offset = this.getOffset(`#${fixedCards[i].dataset.placeHolder}`);
            fixedCards[i].style.transform = `translate(${offset.left}px, ${offset.top}px)`;
        }

        setTimeout(function(app) {
            app.resizeLock = false;
            app.onResize();
        }, 100, this)
    } else
        this.resizeRequested = true;
}

ScopaApplication.prototype.clearMatch = function() {
    var fixedCards = document.querySelectorAll(".fixedCard, .fixedDeck");

    for (var i = 0; i < fixedCards.length; i++) {
        document.body.removeChild(fixedCards[i]);
    }

    var used = document.querySelectorAll("*[data-used='1']");

    for (var i = 0; i < used.length; i++) {
        used[i].dataset.used = 0;
    }

    this.match = null;
}

ScopaApplication.prototype.onStartGame = function() {
    this.clearMatch();

    var number_of_players = document.querySelector("#numberOfPlayers").selectedOptions[0].id.replace("numberOfPlayers-", "");
    var variant = this.variants[document.querySelector("#variant").selectedOptions[0].dataset.index];
    var username = document.getElementById("userName").value;

    this.match = new variant.class();

    var message;
    var teams;

    if (number_of_players == 2) {
        message = {
            command: "start",
            data: [
                [{ type: "human", name: username }],
                [{ type: "cpu", name: "cpu1" }]
            ]
        };
        teams = [username, "cpu1"];
    } else {
        message = {
            command: "start",
            data: [
                [{ type: "human", name: username }, { type: "cpu", name: "cpu1" }],
                [{ type: "cpu", name: "cpu2" }, { type: "cpu", name: "cpu3" }]
            ]
        };
        teams = [`${username}, cpu1`, "cpu2, cpu3"];
    }

    this.matchTeams = message.data;
    this.localPlayer = settings.username;
    var response = this.match.send(message);

    settings.number_of_players = number_of_players;
    settings.variant = variant.name;
    settings.username = username;

    document.querySelector("#new-game").hidden = true;

    //init summary dialog
    var table = document.querySelector("#summaryTable");

    //remove all columns except the first one
    for (var j = 0; j < table.children.length; j++)
        for (var k = table.children[j].children.length - 1; k > 0; k--)
            table.children[j].removeChild(table.children[j].children[k]);

    for (var k = 0; k < table.children.length; k++)
        table.children[k].hidden = true;

    var playersRow = table.querySelector("#players");
    var totalRow = table.querySelector("#total");
    var td = document.createElement("td");
    td.textContent = teams[0];
    playersRow.appendChild(td);
    td = document.createElement("td");
    td.textContent = teams[1];
    playersRow.appendChild(td);
    playersRow.hidden = false;

    td = document.createElement("td");
    td.textContent = "0";
    totalRow.appendChild(td);
    td = document.createElement("td");
    td.textContent = "0";
    totalRow.appendChild(td);
    totalRow.hidden = false;

    this.analyze(response);
}

ScopaApplication.prototype.getOffset = function(selector) {
    var el = document.querySelector(selector);

    var offset = { "top": el.offsetTop, "left": el.offsetLeft };

    while (el.offsetParent) {
        offset["left"] += el.offsetParent.offsetLeft;
        offset["top"] += el.offsetParent.offsetTop;
        el = el.offsetParent;
    }

    return offset;
}

ScopaApplication.prototype.initTable = function(cards) {
    var players = [];
    for (var j in this.matchTeams[0])
        for (var i in this.matchTeams)
            players.push(this.matchTeams[i][j]);

    var n = 0;
    while (!(players[n].name === this.localPlayer))
        n += 1;

    //shift players list to have local player at position 0
    players.push.apply(players, players.splice(0, n))

    var positions;
    if (players.length === 2)
        positions = [0, 2];
    else if (players.length === 4)
        positions = [0, 1, 2, 3];

    var orientations = ["h", "v", "h", "v"];

    var div;
    for (var i in cards) {
        if (cards[i].type === "hand")
            for (var j in players)
                if (players[j].name === cards[i].owners[0]) {
                    div = document.querySelector(`#hand_${positions[j]}`);

                    while (div.firstChild) div.removeChild(div.firstChild);

                    for (var k = 0; k < cards[i].length; k++) {
                        var placeHolder = document.createElement("div");
                        placeHolder.id = `${cards[i].owners[0]}_card_${k}`;
                        placeHolder.className = `c${orientations[positions[j]]}${cards[i].length}`;
                        div.appendChild(placeHolder);
                        if (orientations[positions[j]] === "v" && k !== cards[i].length - 1)
                            div.appendChild(document.createElement("br"));
                    }
                    div.lastChild.className = "card";
                }


        if (cards[i].type === "deck") {
            if (cards[i].owners.length === 0)
                div = document.querySelector("#mainDeck");

            else if (cards[i].owners.indexOf(this.localPlayer) > -1)
                div = document.querySelector("#team0Deck");

            else
                div = document.querySelector("#team1Deck");
        }

        if (cards[i].type === "table")
            div = document.querySelector("#tableCards");


        div.dataset.id = cards[i].id;
    }
}

ScopaApplication.prototype.updateCards = function(cards) {
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].type === "deck") {
            var deckImg = document.querySelector(`#${cards[i].id}Img`);
            if (!deckImg) {
                deckImg = document.createElement("img");
                deckImg.className = "fixedDeck";
                deckImg.id = `${cards[i].id}Img`;
                deckImg.dataset.placeHolder = document.querySelector(`div[data-id='${cards[i].id}']`).id;
                document.body.appendChild(deckImg);
                offset = this.getOffset(`div[data-id='${cards[i].id}']`);
                deckImg.style.transform = `translate(${offset.left}px, ${offset.top}px)`;
            }

            this.graphicsManager.updateDeckImg(deckImg, cards[i]);
        }
    }
}

ScopaApplication.prototype.analyze = function(response) {
    //console.log("response:", response);
    if (response.moves.length === 0 && response.cards.length === 0 && response.infos.length === 0)
        return;

    if (!this.match) return;

    var movesLog = document.querySelector("#moves-log");
    var messagesLog = document.querySelector("#messages-log");

    for (var i = 0; i < response.infos.length; i++) {
        if (response.infos[i].info === "cards_description") {
            this.initTable(response.infos[i].data);
            this.updateCards(response.infos[i].data);
        }

        if (response.infos[i].info === "first_player") {
            //clear chronology
            messagesLog.innerHTML = "";
            movesLog.innerHTML = "";

            //clean summary dialog
            var continue_btn = document.querySelector("#continue");
            continue_btn.parentNode.hidden = true;

            //hide all rows except total and players
            var table = document.querySelector("#summaryTable");
            for (var k = 0; k < table.children.length; k++) {
                if (table.children[k].id === "players" || table.children[k].id === "total")
                    table.children[k].hidden = false;
                else
                    table.children[k].hidden = true;
            }
        }

        if (response.infos[i].info === "first_player" ||
            response.infos[i].info === "cards_value_lt_10" ||
            response.infos[i].info === "2_equal_cards" ||
            response.infos[i].info === "3_equal_cards") {
            var string = this.getLocaleString(response.infos[i].info).format(response.infos[i].data);
            this.displayMessage(response.infos[i].info, string);
        }

        if (response.infos[i].info === "waiting" && response.infos[i].data === this.localPlayer) {
            this.userCanPlay = true;
            return;
        }

        if (response.infos[i].info === "choice" && response.infos[i].data.player === this.localPlayer) {
            this.userCanPlay = true;
            var choices = document.querySelector("#choices");

            while (choices.firstChild) choices.removeChild(choices.firstChild);

            var takes = response.infos[i].data.takes;
            for (var j = 0; j < takes.length; j++) {
                var div = document.createElement("div");
                div.className = "choice-div";
                for (var k = 0; k < takes[j].length; k++) {
                    cardImg = document.createElement("img");
                    this.graphicsManager.updateCardImg(cardImg, takes[j][k]);
                    div.appendChild(cardImg);

                    cardImg.addEventListener("click", (function(app, index) {
                        return function() {
                            app.userCanPlay = false;

                            document.querySelector("#move-choice").hidden = true;

                            var newResponse = app.match.send({
                                "command": "human_play",
                                "data": {
                                    player: app.localPlayer,
                                    card: app.playedCard,
                                    take: index
                                }
                            });
                            app.analyze(newResponse);
                        }
                    })(this, j));
                }
                choices.appendChild(div);
                choices.appendChild(document.createElement("br"));
            }

            document.querySelector("#move-choice").hidden = false;
            return;
        }

        if (response.infos[i].info === "summary") {
            var summary = response.infos[i].data;

            var table = document.querySelector("#summaryTable");

            //remove all columns except the first one
            for (var j = 0; j < table.children.length; j++)
                for (var k = table.children[j].children.length - 1; k > 0; k--)
                    table.children[j].removeChild(table.children[j].children[k]);

            for (var j = 0; j < summary.length; j++) {
                summary[j].players = summary[j].players.length == 1 ?
                    summary[j].players[0] : `${summary[j].players[0]}, ${summary[j].players[1]}`;

                for (var k = 0; k < table.children.length; k++) {
                    var row = table.children[k];

                    if (summary[j][row.id] != undefined) {
                        var td = document.createElement("td");
                        td.textContent = `${summary[j][row.id]}`;
                        row.appendChild(td);
                        row.hidden = false;
                    } else {
                        row.hidden = true;
                    }
                }
            }

            var continue_btn = document.querySelector("#continue");
            continue_btn.parentNode.hidden = false;

            this.showDialog("summary");

            return;
        }

        if (response.infos[i].info === "winner") {
            var string = this.getLocaleString("winner").format(response.infos[i].data);
            document.querySelector("#winner").textContent = string;
            document.querySelector("#match-end").hidden = false;
            return;
        }
    }

    this.updateCards(response.cards, document.querySelector("#mainDeck").dataset.id);
    var wait = 1;

    for (var i = 0; i < response.moves.length; i++) {
        var source = document.querySelector(`*[data-id='${response.moves[i].source}']`);
        var dest = document.querySelector(`*[data-id='${response.moves[i].dest}']`);

        //update chronology
        if (source.id === "hand_0") {
            movesLog.innerHTML = "";
        }
        if (source.id !== "mainDeck") {
            var label = document.createElement("label");
            label.textContent = `${response.moves[i].source} -> ${response.moves[i].dest}`;
            movesLog.appendChild(label);
            movesLog.appendChild(document.createElement("br"));
        }

        for (var j = 0; j < response.moves[i].cards.length; j++) {
            var card = response.moves[i].cards[j];
            var cardImg;
            var hideCard = !(response.moves[i].visible || response.moves[i].visible_to === this.localPlayer);

            if (source.id === "mainDeck") {
                cardImg = document.createElement("img");
                cardImg.className = "fixedCard";
                cardImg.id = `absCard${card.id}`;
                document.body.appendChild(cardImg);
                offset = this.getOffset("#mainDeck");
                cardImg.style.transform = `translate(${offset.left}px, ${offset.top}px)`;
                this.graphicsManager.updateCardImg(cardImg, card, hideCard);

                if (dest.id === "hand_0") {
                    cardImg.addEventListener("click", (function(app, card) {
                        return function() {
                            if (app.userCanPlay) {
                                app.userCanPlay = false;

                                app.playedCard = card.id;
                                var newResponse = app.match.send({
                                    "command": "human_play",
                                    "data": {
                                        player: app.localPlayer,
                                        card: card.id
                                    }
                                });

                                app.analyze(newResponse);
                            }
                        }
                    })(this, card));
                }
            } else {
                cardImg = document.querySelector(`#absCard${card.id}`);
                document.getElementById(cardImg.dataset.placeHolder).dataset.used = 0;

                //show the card when cpu plays it
                if (source.id != "hand_0" && source.id != "tableCards")
                    this.graphicsManager.updateCardImg(cardImg, card, hideCard);

                //delete card after it is taken from a player
                if (source.id === "tableCards") {
                    setTimeout((function(cardImg) { return function() { document.body.removeChild(cardImg); } })(cardImg), 1000);
                }

                //update chronology
                var img = document.createElement("img");
                this.graphicsManager.updateCardImg(img, card, hideCard);
                movesLog.appendChild(img);
            }

            var placeHolders = dest.querySelectorAll("div");
            var placeHolder = dest;

            for (var k = 0; k < placeHolders.length; k++) {
                if (!placeHolders[k].dataset.used || placeHolders[k].dataset.used == 0) {
                    placeHolder = placeHolders[k];
                    placeHolder.dataset.used = 1;
                    break;
                }
            }

            if (response.moves[i].move_on) {
                placeHolder.dataset.used = 0;
                var move_on = document.querySelector(`#absCard${response.moves[i].move_on.id}`);
                placeHolder = document.querySelector(`#${move_on.dataset.placeHolder}`);
            }

            cardImg.dataset.placeHolder = placeHolder.id;

            var offset = this.getOffset(`#${placeHolder.id}`);
            if (response.moves[i].move_on) {
                wait = 1.5;
                offset.top += Math.floor(0.3 * this.graphicsManager.cw);
                offset.left += Math.floor(0.3 * this.graphicsManager.cw);
            }

            cardImg.animate([
                // keyframes
                { transform: cardImg.style.transform },
                { transform: `translate(${offset.left}px, ${offset.top}px)` }
            ], {
                // timing options
                duration: settings.animation_duration[settings.speed] * 1000,
                easing: "linear"
            });

            cardImg.style.transform = `translate(${offset.left}px, ${offset.top}px)`;
        }

        //update chronology
        if (source.id !== "mainDeck")
            movesLog.appendChild(document.createElement("br"));
    }

    setTimeout(function(app) {
        var newResponse = app.match.send({ "command": "next" });
        app.analyze(newResponse);
    }, settings.animation_duration[settings.speed] * wait * 1000, this);
}

app = new ScopaApplication();

app.registerGame(ReBelloMatch);

app.updateNumberOfPlayers();

window.onload = function() {
    //language settings
    if (navigator.language && navigator.language != "en") {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = `locales/${navigator.language}.js`;
        document.body.appendChild(script);
    }

    app.showDialog("new-game");
}