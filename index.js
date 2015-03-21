var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cardid = 1;
var num_players = 0;
var Cards;
var NUM_DEAL = 5;
var PlayersInfo = new Array();
var Players = new Array();

var PlayerInfo = function(id,name){
    var self = this;
    self.p_name = name;
    self.p_id = id;
    return self;
}

var Player = function(id,name,cards)
{
    var self = this;
    self.p_id = id;
    self.p_name = name;
    self.p_cards = cards;
    return self;
}

var Card = function(rank,suit)
{
    var self = this;
    self.id = cardid++;
    self.rank = rank;
    self.suit = suit;
    self.name = self.rank + self.suit;
    return self;
}
var removePlayer=function(player)
{
    for(i=0;i<Players.length;i++)   
    {
        if(Players[i].p_id == player.p_id)
        {
            Players.splice(i,1);
            return;
        }
    }
}

var removeCards = function(p_id,num){
   var askedPlayer;
    for (i = 0; i < Players.length; i++) {
        if (Players[i].p_id == p_id) {
            askedPlayer = Players[i];
            for (j = 0; j < askedPlayer.p_cards.length; j++) {
                if (askedPlayer.p_cards[j].rank == num) {
                    askedPlayer.p_cards.splice(j,1);
                }
            }
        }
    }
    return askedPlayer;
}

function stackShuffle() {

    var i, j, k;
    var temp;
    // Shuffle the stack 'n' times.

    for (j = 0; j < Cards.length; j++) {
        k = Math.floor(Math.random() * Cards.length);
        temp = Cards[j];
        Cards[j] =Cards[k];
        Cards[k] = temp;
    }
}

function stackDeal() {
    if (Cards.length > 0)
        return Cards.shift();
  
    else
        return null;
}



var findCards = function (num, p_id) {
    var resultAsk = new Array();
    for (i = 0; i < Players.length; i++) {
        if (Players[i].p_id == p_id) {
            for (j = 0; j < Players[i].p_cards.length; j++) {
                if (Players[i].p_cards[j].rank == num) {
                    resultAsk.push(Players[i].p_cards[j]);
                }
            }
        }
    }
    return resultAsk;
}


    var createDeck = function() {

        var n =1;
        var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9",
                              "10", "J", "Q", "K");
        var suits = new Array("C", "D", "H", "S");
        var i, j, k;
        var m;
        l =0;
        m = ranks.length * suits.length;

        // Set array of cards.

        Cards = new Array(m);

        // Fill the array with 'n' packs of cards.

        // for (i = 0; i < n; i++)
        for (j = 0; j < suits.length; j++)
            for (k = 0; k < ranks.length; k++)
                Cards[l++] =
                  new Card(ranks[k], suits[j]);
    }

    app.get('/', function(req, res){
        res.sendFile('index.html', { root: __dirname });
    });

    io.on('connection', function(socket){
        num_players++;
        var newPlayer;
        if(num_players==1)
        {
            createDeck();
        }

    
        socket.on('requestCards',function(name){
            stackShuffle();
            var player_cards =  new Array(NUM_DEAL);
   
            for(i = 0; i < NUM_DEAL; i++) {
                var cardReturned = stackDeal();
                console.log("Card Removed"+cardReturned.name);
                player_cards[i] = cardReturned;
            }
            for(i =0;i< NUM_DEAL;i++)
            {
                console.log(player_cards[i].name);
            } 
            newPlayer = new Player(socket.id,name,player_cards);
            Players.push(newPlayer);
            socket.emit('sendCards',newPlayer);
        
        });
    
   
  
    
        socket.on('myName' , function(name){
            console.log('new player with name: ' + name);
            var newPlayerInfo = new PlayerInfo(socket.id,name);
            PlayersInfo.push(newPlayerInfo);
            io.sockets.emit('playersInfoObject',PlayersInfo);
        });
    
    
        socket.on('ask',function(number,p_id){
           
            console.log("Number:"+number+"+Pid :"+p_id); 
            var askedCards = findCards(number,p_id);
            console.log(askedCards.length);
            
            
            for(var i=0;i<askedCards.length;i++)
            {
                newPlayer.p_cards.push(askedCards[i]);
            }
            
            
            
            if(askedCards.length > 0)
            {
                var askedPlayer = removeCards(p_id,askedCards[0].rank);
                removePlayer(askedPlayer);
                console.log("Asked Player Removed:"+askedPlayer.p_id);
                Players.push(askedPlayer);
                if (io.sockets.connected[p_id]) {
                io.sockets.connected[p_id].emit('sendCards',askedPlayer);
                
                    console.log(askedPlayer.p_cards.length);
                }
            
            
            }
                
            
            
            removePlayer(newPlayer);
            console.log("Player Removed:"+newPlayer.p_id);
            Players.push(newPlayer);
            console.log("Player Pushed:"+newPlayer.p_id);
            socket.emit("resultAsk",newPlayer);
            
            
            
        });
    
    
     
    });

    http.listen(3000, function(){
        console.log('listening on *:3000');
    });