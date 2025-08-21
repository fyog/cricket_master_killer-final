import { useState, useEffect, useRef } from 'react';
import dart_board from './dart_board.svg';
import './App.css';

/*
main function (runs the app)
*/
function App() {

  // game states (state variables)
  const [step, setStep] = useState('intro');
  const [numPlayers, setNumPlayers] = useState(2); //start with 2 players by default
  const [playerNames, setPlayerNames] = useState([]); //empty player array

  /* 
  handleStartSetup()
  fills array numPlayers with empty strings, sets step to 'name-entry'
  */
  const handleStartSetup = () => {
    setPlayerNames(Array(numPlayers).fill('')); //initialize with empty strings
    setStep('name-entry');
  };

  /* 
  handleStartSetup(index, name)
  updates playerNames depending on index and name passed to the function
  */
  const handleNameChange = (index, name) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated); //apply updated player names
  };

  /* handleStartSetup(index, name)
   maps player names accordingly and sets step to 'game'
  */
  const handleStartGame = () => {
    const filledNames = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`); //loops through each name and its index (trim removes whitespace from the name string)
    setPlayerNames(filledNames);
    setStep('game');
  };

  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className="App">
      <header className="App-header">
        <h2> CRICKET MASTER KILLER </h2>
        {step === 'intro' && (
          <>
            <img src={dart_board} className="Dart-board" alt='dart-board' />
            <div className="dropdown-score select">
              <label htmlFor="playerCount">Number of Players:</label>
              <select
                id="playerCount"
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value))}
              >
                {[...Array(8)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" onClick={handleStartSetup}>
              Next
            </button>
          </>
        )}
        {step === 'name-entry' && (
          <div className="dropdown-score select">
            <h>Enter Player Names:</h>
            <div>
            </div>
            {[...Array(numPlayers)].map((_, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Player ${i + 1}`}
                value={playerNames[i] || ''}
                onChange={(e) => handleNameChange(i, e.target.value)}
                className="name-input"
              />
            ))}
            <button className="button" onClick={handleStartGame}>
              Begin Game
            </button>
          </div>
        )}
        {step === 'game' && (
          <ScoringGrid
            playerNames={playerNames}
            onRestart={() => {
              setStep('intro');
              setPlayerNames([]);
            }}
          />
        )}
      </header>
    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

/*
scoringGrid(playerNames, onRestart)
react component that handles game/scoring logic
*/
function ScoringGrid({ playerNames, onRestart }) {

  const scoringNumbers = [20, 19, 18, 17, 16, 15, 'Bull'];
  const otherNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 'Miss'];
  const [history, setHistory] = useState([])
  const [round, setRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [throwCount, setThrowCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const currentPlayer = players[currentPlayerIndex];
  const [modifier, setModifier] = useState(1);
  const [totalTurns, setTotalTurns] = useState(0);
  const renderMarks = (hits) => "✅".repeat(Math.min(hits, 3));

  //creates a mapping such that 1:20, Bull is mapped to 1:20, 25
  //ie. mapping = 1:1, 2:2, 3:3, 4:4, ..., 20:20, and Bull:25
  const valueMap = {
    Bull: 25,
    Miss: 25,
    ...Object.fromEntries([...Array(21).keys()].slice(1).map(n => [n, n]))
  };
  const allScoringKeys = [...scoringNumbers, ...otherNumbers]; //combines all board numbers into a new list (shallow clone)
  const initialScore = Object.fromEntries(allScoringKeys.map(n => [n, 0])); //maps a score of zero to all of the scoring keys

  /*
  useEffect() 
  synchronize a component with an external system
  */
  useEffect(() => {
    const newPlayers = playerNames.map(name => ({
      name,
      score: { ...initialScore },
      totalScore: 0,
    })); //creates a map of player names to their name, scores for each number, and total score
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setThrowCount(0);
  }, [playerNames] //dependency array is playerNames (throws a warning)
  );

  /*
  handles when score buttons are pressed
  */
  const handleScoreClick = (scoreKey, mult = 1) => {

    /*
    setHistory(prev)
    save current state
    */
    setHistory(prev => [
      ...prev,
      { players: JSON.parse(JSON.stringify(players)), currentPlayerIndex, throwCount, multiplier: mult, modifier, round }
    ]);

    /*
    setPlayers(prevPlayers)
    updates player scores
    */
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const current = { ...updatedPlayers[currentPlayerIndex] };
      const updatedScore = { ...current.score };
      const currentHits = updatedScore[scoreKey];
      const othersHaveNotClosed = updatedPlayers.some(
        (p, i) => i !== currentPlayerIndex && p.score[scoreKey] < 3
      );

      //scoring logic
      if (otherNumbers.includes(scoreKey)) {
        current.totalScore += valueMap[scoreKey] * mult;
      } else {
        if (currentHits < 3) {
          updatedScore[scoreKey] = currentHits + mult;
          const extraHits = Math.max(0, updatedScore[scoreKey] - 3);
          if (extraHits > 0) {
            if (othersHaveNotClosed) {
              updatedScore[scoreKey] = 3;
              updatedPlayers.forEach((p, i) => {
                if (i !== currentPlayerIndex) {
                  const diff = Math.max(0, updatedScore[scoreKey] - p.score[scoreKey]);
                  p.totalScore += valueMap[scoreKey] * extraHits * diff / 2;
                }
              });
            } else {
              const diff = Math.max(0, updatedScore[scoreKey] - 3);
              updatedScore[scoreKey] = 3;
              current.totalScore += valueMap[scoreKey] * diff;
            }
          }
        } else {
          if (othersHaveNotClosed) {
            updatedPlayers.forEach((p, i) => {
              if (i !== currentPlayerIndex) {
                const diff = Math.max(0, 3 - p.score[scoreKey]);
                p.totalScore += valueMap[scoreKey] * diff * mult / 2;
              }
            });
          } else {
            current.totalScore += valueMap[scoreKey] * mult;
          }
        }
      }

      //update player
      current.score = updatedScore;
      updatedPlayers[currentPlayerIndex] = current;
      return updatedPlayers;
    });

    //increment turn count in state
    setTotalTurns(prev => prev + 1);

    /*
    setThrowCount(prevCount)
    handle throw count & player switching
    */
    setThrowCount(prevCount => {
      const newCount = prevCount + 1;
      if (newCount >= 3) {
        setCurrentPlayerIndex(prev => (prev + 1) % playerNames.length);
        return 0; // reset throws
      }
      return newCount;
    });

    /*
    setRound(prev)
    increment the round whenever all players have made their throws
    */
    setRound(prev => {
      if ((totalTurns + 1) % (3 * playerNames.length) === 0) {
        return prev + 1;
      }
      return prev;
    });
    const newCount = throwCount + 1;
    if (newCount >= 3) {
      setThrowCount(0);
      setCurrentPlayerIndex(prev => (prev + 1) % playerNames.length);
    } else {
      setThrowCount(newCount);
    }
  };

  /*
  handleUndo()
  undoes the last move by reverting to the previously saved state
  */
  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev; //nothing to undo

      const lastState = prev[prev.length - 1];
      setPlayers(lastState.players);
      setCurrentPlayerIndex(lastState.currentPlayerIndex);
      setThrowCount(lastState.throwCount);
      setMultiplier(lastState.multiplier);
      setRound(lastState.round);

      return prev.slice(0, -1); //remove last history entry
    });
  };

  //------------------------------------------------------------------------------------------------------------------
  return (
    <div className='subheader container'>
      <div className=".subheader">
        <div className='stats'>
          <h3>Round: {round}, {currentPlayer?.name}, Throw {throwCount + 1} / 3</h3>
        </div>
      </div>
      <div>
        <h3>Non-Cricket numbers:</h3>
      </div>
      {/* Singles */}
      <div className="dropdown-score-singles">
        <h>Singles:</h>
        <select
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!val) return;
            setMultiplier(1);
            handleScoreClick(val, 1);
            e.target.value = "";
          }}
        >
          <option value=""> Select a number </option>
          {otherNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* Doubles */}
      <div className="dropdown-score-doubles">
        <h>Doubles: </h>
        <select onChange={(e) => {
          const val = Number(e.target.value);
          if (!val) return;
          handleScoreClick(val, 2); // doubles
          e.target.value = "";
        }}>
          <option value=""> Select a number </option>
          {otherNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* Triples */}
      <div className="dropdown-score-triples">
        <h>Triples: </h>
        <select onChange={(e) => {
          const val = Number(e.target.value);
          if (!val) return;
          handleScoreClick(val, 3); // triples
          e.target.value = "";
        }}>
          <option value=""> Select a number </option>
          {otherNumbers.map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <h3> Cricket Numbers:</h3>
      <div className="multiplier-buttons">
        <button onClick={() => handleScoreClick(20, 1)}>Single 20</button>
        <button onClick={() => handleScoreClick(19, 1)}>Single 19</button>
        <button onClick={() => handleScoreClick(18, 1)}>Single 18</button>
        <button onClick={() => handleScoreClick(17, 1)}>Single 17</button>
        <button onClick={() => handleScoreClick(16, 1)}>Single 16</button>
        <button onClick={() => handleScoreClick(15, 1)}>Single 15</button>
      </div>
      <div className="multiplier-buttons1">
        <button onClick={() => handleScoreClick(20, 2)}>Double 20</button>
        <button onClick={() => handleScoreClick(19, 2)}>Double 19</button>
        <button onClick={() => handleScoreClick(18, 2)}>Double 18</button>
        <button onClick={() => handleScoreClick(17, 2)}>Double 17</button>
        <button onClick={() => handleScoreClick(16, 2)}>Double 16</button>
        <button onClick={() => handleScoreClick(15, 2)}>Double 15</button>
      </div>
      <div className="multiplier-buttons2">
        <button onClick={() => handleScoreClick(20, 3)}>Triple 20</button>
        <button onClick={() => handleScoreClick(19, 3)}>Triple 19</button>
        <button onClick={() => handleScoreClick(18, 3)}>Triple 18</button>
        <button onClick={() => handleScoreClick(17, 3)}>Triple 17</button>
        <button onClick={() => handleScoreClick(16, 3)}>Triple 16</button>
        <button onClick={() => handleScoreClick(15, 3)}>Triple 15</button>
      </div>
      <button onClick={() => { handleScoreClick("Miss", 1) }} className="miss"> Miss </button>
      <button onClick={() => { handleScoreClick("Bull", 1) }} className="single-bull"> Single Bull </button>
      <button onClick={() => { handleScoreClick("Bull", 2) }} className="double-bull"> Double Bull </button>
      <button className="undo-button" onClick={handleUndo}> Undo </button>
      <button className="restart-button" onClick={onRestart}> Restart Game </button>
      <div className="player-scores">
        {players.map((player, idx) => (
          <div key={idx} className="player-card">
            <h3>{player.name}</h3>
            <p><strong>Score:</strong> {player.totalScore}</p>
            <ul>
              {scoringNumbers.map((num) => (
                <li key={num}>{num}: {renderMarks(player.score[num])}</li>

              ))}
            </ul>
          </div>
        ))}

      </div>

    </div>
  );
}
//------------------------------------------------------------------------------------------------------------------

export default App;