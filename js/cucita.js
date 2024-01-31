if (typeof module !== "undefined")
{
    global.ClassicMatch = require("./classic.js").GameClass;
}

function CucitaMatch() 
{
    this.name = "Cucita";
    this.number_of_players = [[2,1],[2,2]];    
    this.victoryPoints = 21;
    
    var classic = new ClassicMatch();
    this.aiValues = classic.aiValues;
    
    this.aiValues.opponent_certain_take_after = function (mem) {return -5};
    this.aiValues.opponent_certain_scopa_after = function (mem) {return -20};
    
    this.cardsToPlayers = 3;
    this.cardsToTable = 4;
}

CucitaMatch.prototype = new ClassicMatch();

CucitaMatch.prototype.giveCardsToPlayers = function(response)
{
    for (var i=0; i<this.players.length; i++)
    {
        var move = this.deck.move(this.players[i].hand, this.cardsToPlayers);
        
        var faceup = false, sum = 0;
        
        for (var j=0; j<move.cards.length; j++)
            sum += move.cards[j].value;
        
        if (sum <= 9)
        {
            faceup = true;
            this.players[i].team.takenCards.side_cards.length += 2;
            response.infos.push({info: "cards_value_lt_10", data: this.players[i].name});
        }
        
        if (move.cards[0].value == move.cards[1].value &&
            move.cards[1].value == move.cards[2].value)
        {
            faceup = true;
            this.players[i].team.takenCards.side_cards.length += 7;
            response.infos.push({info: "3_equal_cards", data: this.players[i].name});
        }
        
        else if (move.cards[0].value == move.cards[1].value ||
            move.cards[0].value == move.cards[2].value ||
            move.cards[1].value == move.cards[2].value)
        {
            faceup = true;
            this.players[i].team.takenCards.side_cards.length += 3;
            response.infos.push({info: "2_equal_cards", data: this.players[i].name});
        }
        
        if (faceup)
        {
            this.players[i].hand.covered = false;
            response.cards.push(this.players[i].team.takenCards.toObject());
        }
        else
            this.players[i].hand.covered = true;
        
        if (!this.players[i].hand.covered)
        {
            move.visible = true;
            move.visible_to = undefined;
        }
        
        response.moves.push(move);        
        response.cards.push(this.players[i].hand.toObject());
    }
    response.cards.push(this.deck.toObject());
}

//export node.js server module
if (typeof module !== "undefined")
{
    module.exports = {
        GameClass: CucitaMatch
    };
}
