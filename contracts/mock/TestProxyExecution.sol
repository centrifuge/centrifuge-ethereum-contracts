pragma solidity ^0.5.3;


contract TextProxyExecution {

  // Counts calls by msg.sender
  mapping(address => uint) public numCalls;
  mapping(address => uint) public paidCalls;

  function callMe()
  external
  payable
  {
    numCalls[msg.sender] += 1;
  }

  function callMeWithMoney()
  external
  payable
  {
    require(msg.value > 0);
    paidCalls[msg.sender] += 1;
  }

  function getCallsFrom(address caller)
  external
  view
  returns (uint noOfCalls)
  {
    return numCalls[caller];
  }

  function getPayedCallsFrom(address caller)
  external
  view
  returns (uint noOfCalls)
  {
    return paidCalls[caller];
  }
}
