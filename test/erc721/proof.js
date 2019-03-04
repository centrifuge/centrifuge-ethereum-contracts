let proof = require('./proof.json');

let documentIdentifier = proof.header.version_id;
let validRootHash = proof.header.document_root;

let grossAmount = proof.field_proofs[0];
let currency = proof.field_proofs[1];
let due_date = proof.field_proofs[2];
let sender = proof.field_proofs[3];
let status = proof.field_proofs[4];
let nextVersion = proof.field_proofs[5];
let nftUnique = proof.field_proofs[6];
let readRole = proof.field_proofs[7];
let readRoleAction = proof.field_proofs[8];
let tokenRole = proof.field_proofs[9];


let tokenId = nftUnique.value;
let contractAddress = "0x6824bb47e3372791da0f8f0f428ca61c0fc4e6f9";
let readRuleIndex = "0x" + readRole.property.substr(18, 16);
let tokenURI = "http://test.com";


module.exports = {
    grossAmount,
    currency,
    due_date,
    sender,
    status,
    nextVersion,
    nftUnique,
    readRole,
    readRoleAction,
    tokenRole,
    tokenId,
    documentIdentifier,
    validRootHash,
    contractAddress,
    readRuleIndex,
    tokenURI,
};
