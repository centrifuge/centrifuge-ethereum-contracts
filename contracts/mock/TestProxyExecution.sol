pragma solidity ^0.5.3;


contract TextProxyExecution {

  // Counts calls by msg.sender
  mapping(address => uint) public numCalls;

  function callMe()
  external
  {
    numCalls[msg.sender] += 1;
  }

  function callMeRevert()
  external
  {
    require(1 > 2, 'This will revert every time');
  }

  function getCallsFrom(address caller)
  external
  view
  returns (uint noOfCalls)
  {
    return numCalls[caller];
  }
}
