if (typeof module !== "undefined")
{
    global.ClassicMatch = require("./classic.js").GameClass;
}

function ScoponeMatch() 
{
    this.name = "Scopone";
    this.number_of_players = [[2,2]];    
    this.victoryPoints = 11;
    
    this.cardsToPlayers = 10;
    this.cardsToTable = 0;
}

ScoponeMatch.prototype = new ClassicMatch();

//export node.js server module
if (typeof module !== "undefined")
{
    module.exports = {
        GameClass: ScoponeMatch
    };
}
