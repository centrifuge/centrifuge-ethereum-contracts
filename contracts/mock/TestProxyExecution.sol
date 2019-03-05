pragma solidity 0.5.3;


contract TextProxyExecution {

  // Counts calls by msg.sender
  mapping(address => uint) public numCalls;

  function callMe()
  external
  {
    numCalls[msg.sender] += 1;
  }

  function getCallsFrom(address caller)
  external
  view
  returns (uint noOfCalls)
  {
    return numCalls[caller];
  }
}
