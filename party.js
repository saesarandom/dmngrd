// Party management system
class PartyManager {
    constructor(game) {
        this.game = game;
        this.currentParty = null; // { members: [playerNames], leader: playerName }
        this.partyInvites = []; // Pending invites
        this.isUIVisible = false;
    }

    toggleUI() {
        this.isUIVisible = !this.isUIVisible;
        const partyUI = document.getElementById('party-ui');
        console.log('[Party] Toggle UI:', this.isUIVisible);
        if (partyUI) {
            partyUI.style.display = this.isUIVisible ? 'block' : 'none';
            if (this.isUIVisible) {
                this.refreshPlayerList();
            }
        } else {
            console.error('[Party] party-ui element not found!');
        }
    }

    refreshPlayerList() {
        // Request updated player list from server
        console.log('[Party] Refreshing player list, gameName:', this.game.gameName, 'socket:', !!this.game.socket);
        if (this.game.socket && this.game.gameName) {
            console.log('[Party] Emitting request_player_list');
            this.game.socket.emit('request_player_list', {
                gameName: this.game.gameName
            });
        } else {
            console.error('[Party] Cannot refresh - missing socket or gameName');
        }
    }

    displayPlayerList(players) {
        console.log('[Party] Displaying player list:', players);
        const playerListDiv = document.getElementById('party-player-list');
        if (!playerListDiv) {
            console.error('[Party] party-player-list element not found!');
            return;
        }

        playerListDiv.innerHTML = '';

        if (players.length === 0) {
            playerListDiv.innerHTML = '<div style="color: #888; padding: 10px;">No other players in game</div>';
            return;
        }

        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'party-player-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'party-player-info';
            infoDiv.innerHTML = `
        <div class="party-player-name">${player.name}</div>
        <div class="party-player-details">Level ${player.level} ${player.race} ${player.class}</div>
      `;

            const inviteBtn = document.createElement('button');
            inviteBtn.className = 'party-invite-btn';

            // Check if already in party
            if (this.currentParty && this.currentParty.members.includes(player.name)) {
                inviteBtn.textContent = 'In Party';
                inviteBtn.disabled = true;
            } else {
                inviteBtn.textContent = 'Invite';
                inviteBtn.onclick = () => this.sendPartyInvite(player.name);
            }

            playerDiv.appendChild(infoDiv);
            playerDiv.appendChild(inviteBtn);
            playerListDiv.appendChild(playerDiv);
        });
    }

    sendPartyInvite(targetPlayerName) {
        if (this.game.socket && this.game.gameName) {
            this.game.socket.emit('party_invite', {
                gameName: this.game.gameName,
                from: this.game.character.name,
                to: targetPlayerName
            });
            this.game.setMessage(`Party invite sent to ${targetPlayerName}`);
        }
    }

    receivePartyInvite(fromPlayerName) {
        // Show notification and auto-accept for now (can add confirmation later)
        if (confirm(`${fromPlayerName} has invited you to a party. Accept?`)) {
            this.acceptPartyInvite(fromPlayerName);
        }
    }

    acceptPartyInvite(fromPlayerName) {
        if (this.game.socket && this.game.gameName) {
            this.game.socket.emit('party_accept', {
                gameName: this.game.gameName,
                from: fromPlayerName,
                accepter: this.game.character.name
            });
        }
    }

    updateParty(partyData) {
        this.currentParty = partyData;
        this.game.setMessage(`Party formed with: ${partyData.members.join(', ')}`);
        this.refreshPlayerList();
    }

    leaveParty() {
        if (this.game.socket && this.game.gameName && this.currentParty) {
            this.game.socket.emit('party_leave', {
                gameName: this.game.gameName,
                playerName: this.game.character.name
            });
            this.currentParty = null;
            this.game.setMessage('You left the party');
            this.refreshPlayerList();
        }
    }

    isInParty() {
        return this.currentParty !== null;
    }

    getPartyMembers() {
        return this.currentParty ? this.currentParty.members : [];
    }
}
