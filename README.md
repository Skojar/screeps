# screeps
screeps code ideas

1. replace frequent function calls that just gather data to a gatherData(spawn) function, and put the data in memory.
2. move all the architect stuff to the spawn module.
3. fix center and radius, and use it to design walls?
4. or use some fluid mechanism (like the scout road building), or a combination of both.
5. track which roads actually get used and prioritize their repair.  let unused roads decay.
  (I think flags are the solution here, but it could be a lot of CPU.)
  example:  leave an 'i was here' flag if one doesn't aready exist every creeptick
            these flags get decayed every flag decay pass. (currently happens every 1000 ticks)
            tower only repairs roads that have this flag.
            

