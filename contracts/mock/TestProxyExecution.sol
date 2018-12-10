pragma solidity ^0.4.24;


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
