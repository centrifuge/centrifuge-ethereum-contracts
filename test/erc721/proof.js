let proof = require('./proof.json');

let documentIdentifier = proof.header.version_id;
let validRootHash = proof.header.document_root;

let grossAmount = proof.field_proofs[0];
let currency = proof.field_proofs[1];
let due_date = proof.field_proofs[2];
let sender = proof.field_proofs[3];
let status = proof.field_proofs[4];
let signingRoot = proof.field_proofs[5];
let signature = proof.field_proofs[6];
let signatureTransition = proof.field_proofs[7];
let nextVersion = proof.field_proofs[8];
let nftUnique = proof.field_proofs[9];
let readRole = proof.field_proofs[10];
let readRoleAction = proof.field_proofs[11];
let tokenRole = proof.field_proofs[12];


let tokenId = nftUnique.value.match(/^0x0/) ? nftUnique.value.replace(/^0x0/,'0x') : nftUnique.value;
let contractAddress = tokenRole.value.substr(0,42);
let readRuleIndex = "0x" + readRole.property.substr(18, 16);
let tokenURI = "http://test.com";
let publicKey = "0x"+signature.property.substr(-72,64);


module.exports = {
    grossAmount,
    currency,
    due_date,
    sender,
    status,
    signingRoot,
    signature,
    signatureTransition,
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
    publicKey,
    invoiceUnpaidMintParams: {
        properties: [
            grossAmount.property,
            currency.property,
            due_date.property,
            sender.property,
            status.property,
            signingRoot.property,
            signature.property,
            signatureTransition.property,
            nextVersion.property,
            nftUnique.property,
            readRole.property,
            readRoleAction.property,
            tokenRole.property,
        ],
        values: [
            grossAmount.value,
            currency.value,
            due_date.value,
            sender.value,
            status.value,
            signingRoot.hash,
            signature.value,
            signatureTransition.value,
            nextVersion.value,
            nftUnique.value,
            readRole.value,
            readRoleAction.value,
            tokenRole.value
        ],
        salts: [
            grossAmount.salt,
            currency.salt,
            due_date.salt,
            sender.salt,
            status.salt,
            signingRoot.salt,
            signature.salt,
            signatureTransition.salt,
            nextVersion.salt,
            nftUnique.salt,
            readRole.salt,
            readRoleAction.salt,
            tokenRole.salt,
        ],
        /* All fields that are under the signingRoot will use that
        * for the merkle validation. This means that we do not need the last item
        * from the sorted hashses array
        * The merkle validation will fail if the last item is not popped
        * Only Signatures and SigningRoot will be validated against the documentRoot
        * */
        proofs:[
            grossAmount.sorted_hashes.slice(0,-1),
            currency.sorted_hashes.slice(0,-1),
            due_date.sorted_hashes.slice(0,-1),
            sender.sorted_hashes.slice(0,-1),
            status.sorted_hashes.slice(0,-1),
            signingRoot.sorted_hashes,
            signature.sorted_hashes,
            signatureTransition.sorted_hashes,
            nextVersion.sorted_hashes.slice(0,-1),
            nftUnique.sorted_hashes.slice(0,-1),
            readRole.sorted_hashes.slice(0,-1),
            readRoleAction.sorted_hashes.slice(0,-1),
            tokenRole.sorted_hashes.slice(0,-1),
        ]
    }
};
