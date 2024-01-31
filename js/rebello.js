function ReBelloMatch() {
    this.name = "Tounseya";
    this.number_of_players = [
        [2, 1],
        [2, 2]
    ];
    this.victoryPoints = 11;
    this.assignedPoints = ["Carta", "Bermila", "Haya", "Dineri", "re_bello"];

    var classic = new ClassicMatch();
    this.aiValues = classic.aiValues;

    this.aiValues.take_re_bello = function(mem) { return 20 };

    this.cardsToPlayers = 3;
    this.cardsToTable = 4;
}

ReBelloMatch.prototype = new ClassicMatch();

ReBelloMatch.prototype.extraPoints = function(teamSummary) {
    teamSummary.re_bello = 0;
    for (var j = 0; j < teamSummary.coins.length; j++) {
        if (teamSummary.coins[j].value === 10)
            teamSummary.re_bello = 1;
    }
    teamSummary.coins = teamSummary.coins.length;
    teamSummary.partial = teamSummary.scopa;

    return teamSummary;
}

//export node.js server module
if (typeof module !== "undefined") {
    module.exports = {
        GameClass: ReBelloMatch
    };
}