pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Enumerable.sol";
import "contracts/AnchorRepository.sol";
import "contracts/Identity.sol";
import "contracts/IdentityFactory.sol";
import "contracts/lib/MerkleProof.sol";
import "contracts/lib/Utilities.sol";
import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";


/**
 * @title UserMintableERC721
 * Base contract for minting NFTs using documents from the Centrifuge protocol
 * The contract uses precise-proofs(https://github.com/centrifuge/precise-proofs) for proving
 * document fields against an on chain single source of truth repository of all
 * documents in the Centrifuge network called AnchorRepository
 * The precise proofs validation expects proof generation with compact properties  https://github.com/centrifuge/centrifuge-protobufs
 */
contract UserMintableERC721 is Initializable, ERC721, ERC721Enumerable, ERC721Metadata {

  using ECDSA for bytes32;


  // anchor registry
  address internal _anchorRegistry;
  // identity factory
  address internal _identityFactory;

  // array of field names that are being proved using the document root and precise-proofs
  bytes[] internal _mandatoryFields;

  // Base for constructing dynamic metadata token URIS
  // the token uri also contains the registry address. _tokenUriBase + contract address + tokenId
  // This is used to be able to handle  the metadata for all the NFT based on UserMintableERC721
  // in one metadata client. http://metadata.centrifuge.io
  string _tokenUriBase;

  // Constants for compact properties
  // compact property for "invoice.gross_amount",invoice = 1, gross_amount = 14
  bytes constant internal INVOICE_GROSS_AMOUNT = hex"000100000000000e";
  // compact property for invoice.currency, invoice = 1, currency = 13
  bytes constant internal INVOICE_CURRENCY = hex"000100000000000d";
  // compact property for  invoice.due_date, invoice = 1, due_date = 22
  bytes constant internal INVOICE_DUE_DATE = hex"0001000000000016";
  // compact property for  invoice.sender, invoice = 1, sender = 19
  bytes constant internal INVOICE_SENDER = hex"0001000000000013";
  // compact property for  invoice.status, invoice = 1, status = 2
  bytes constant internal INVOICE_STATUS = hex"0001000000000002";
  // compact prop for "next_version"
  bytes constant internal NEXT_VERSION = hex"0100000000000004";
  // compact prop from "nfts"
  bytes constant internal NFTS = hex"0100000000000014";
  // compact prop for "read_rules"
  bytes constant internal READ_RULES = hex"0100000000000013";
  // compact prop for "roles" on a read rule
  bytes constant internal READ_RULES_ROLES = hex"00000002";
  // compact prop for "action" on a read rule
  bytes constant internal READ_RULES_ACTION = hex"00000004";
  // compact prop for "roles"
  bytes constant internal ROLES = hex"0100000000000001";
  // compact prop for "nfts" on a role
  bytes constant internal ROLES_NFTS = hex"00000004";
  // compact prop for "signatures_tree.signatures"
  bytes constant internal SIGNATURE_TREE_SIGNATURES = hex"0300000000000001";
  // compact prop for "signature" for a signature tree signature
  bytes constant internal SIGNATURE_TREE_SIGNATURES_SIGNATURE = hex"00000004";

  // Constants used as values
  // Value for a Read Action. 1 means is has Read Access
  bytes constant internal READ_ACTION_VALUE = hex"0000000000000002";
  // Value for invoice status. bytes for 'unpaid'
  bytes constant internal INVOICE_STATUS_UNPAID = hex"756e70616964";
  // Value of the Signature purpose for an identity. sha256('CENTRIFUGE@SIGNING')
  // solium-disable-next-line
  uint256 constant internal SIGNING_PURPOSE = 0x774a43710604e3ce8db630136980a6ba5a65b5e6686ee51009ed5f3fded6ea7e;


  /**
   * @dev Gets the anchor registry's address that is backing this token
   * @return address The address of the anchor registry
   */
  function getAnchorRegistry()
  external
  view
  returns (address)
  {
    return _anchorRegistry;
  }

  /**
   * @dev Gets the identity factory's address that is used to validate centrifuge identities
   * @return address The address of the identity registry
   */
  function getIdentityFactory()
  external
  view
  returns (address)
  {
    return _identityFactory;
  }

  /**
   * @dev Returns an URI for a given token ID
   * the Uri is constructed dynamic based. _tokenUriBase + contract address + tokenId
   * Throws if the token ID does not exist. May return an empty string.
   * @param tokenId uint256 ID of the token to query
   */
  function tokenURI(
    uint256 tokenId
  )
  external
  view
  returns (
    string memory
  )
  {
    require(_exists(tokenId));

    return string(
      abi.encodePacked(
        _tokenUriBase,
        "0x",
        Utilities.uintToHexStr(uint256(_getOwnAddress())),
        "/0x",
        Utilities.uintToHexStr(tokenId)
      )
    );
  }

  /**
   * @dev Constructor function
   * @param name string The name of this token
   * @param symbol string The shorthand token identifier
   * @param tokenUriBase string base for constructing token uris. It must end with /
   * http://metadata.centrifuge.io/invoice-unpaid/
   * @param anchorRegistry address The address of the anchor registry
   * @param identityFactory address The address of the identity factory
   * using document root and precise-proofs.
   * that is backing this token's mint method.
   */
  function initialize(
    string memory name,
    string memory symbol,
    string memory tokenUriBase,
    address anchorRegistry,
    address identityFactory
  )
  public
  initializer
  {
    _tokenUriBase = tokenUriBase;
    _anchorRegistry = anchorRegistry;
    _identityFactory = identityFactory;

    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize(name, symbol);
  }

  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param to address The recipient of the minted token
   * @param tokenId uint256 The ID for the minted token
   * @param anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param values bytes[] The values of the leafs that are being proved
   * using precise-proofs
   * @param salts bytes32[] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param proofs bytes32[][] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function _mintAnchor(
    address to,
    uint256 tokenId,
    uint256 anchorId,
    bytes32 merkleRoot,
    bytes[] memory values,
    bytes32[] memory salts,
    bytes32[][] memory proofs
  )
  internal
  {

    for (uint i = 0; i < _mandatoryFields.length; i++) {
      require(
        MerkleProof.verifySha256(
          proofs[i],
          merkleRoot,
          sha256(abi.encodePacked(_mandatoryFields[i], values[i], salts[i]))
        ),
        "Mandatory field failed"
      );
    }

    super._mint(to, tokenId);
  }

  /**
   * @dev Address getter. This is needed in order to be able to override
   * the return value in testing Mock for precise proof testing
   * @return address the address of the contact
   */
  function _getOwnAddress()
  internal
  view
  returns (address)
  {
    return address(this);
  }

  /**
   * @dev msg.sender getter. This is needed in order to be able to override
   * the return value in testing Mock for precise proof testing
   * @return address msg.sender
   */
  function _getSender()
  internal
  view
  returns (address)
  {
    return msg.sender;
  }

  /**
   * @dev Identity contract getter. This is needed in order to be able to override
   * the return value in testing Mock for precise proof testing
   * @return Identity a Identity contract
   */
  function _getIdentity(address identity)
  internal
  view
  returns (Identity)
  {
    return Identity(identity);
  }

  /**
   * @dev Retrieve the document root from the linked
   * anchor registry for the given id.
   * @param anchorId bytes32 The ID of the document as identified
   * @return The anchored documentRoot
   */
  function _getDocumentRoot(
    uint256 anchorId
  )
  internal
  view
  returns (bytes32 documentRoot, uint32 anchoredBlock)
  {
    AnchorRepository ar_ = AnchorRepository(_anchorRegistry);
    (, documentRoot, anchoredBlock ) = ar_.getAnchorById(anchorId);
    require(
      documentRoot != 0x0,
      "Document in not anchored in the registry"
    );
  }

  /**
   * @dev Checks if the provided proof is part of the document root
   * and checks if it was created using the linked identity factory
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param property bytes property for leaf construction
   * @param identity address Identity Contract used as a value for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireValidIdentity(
    bytes32 signingRoot,
    bytes memory property,
    address identity,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    require(
      MerkleProof.verifySha256(
        proof, 
          signingRoot,
        sha256(
          abi.encodePacked(
            property,
            identity,
            salt
          )
        )
      ),
      "Identity proof is not valid"
    );

    // Check if address was created by the identity factory
    IdentityFactory identityFactory_ = IdentityFactory(_identityFactory);
    bool valid = identityFactory_.createdIdentity(identity);
    require(
      valid,
      "Identity is not registered"
    );
  }

  /**
   * @dev Checks if the provided next id is part of the
   * document root using precise-proofs and it's not anchored
   * in the registry
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param nextAnchorId uint256 the next id to be anchored
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireIsLatestDocumentVersion(
    bytes32 signingRoot,
    uint256 nextAnchorId,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    AnchorRepository ar_ = AnchorRepository(_anchorRegistry);
    (, bytes32 nextMerkleRoot_, ) = ar_.getAnchorById(nextAnchorId);

    require(
      nextMerkleRoot_ == 0x0,
      "Document has a newer version on chain"
    );

    require(
      MerkleProof.verifySha256(
        proof,
          signingRoot,
        sha256(
          abi.encodePacked(
            NEXT_VERSION,
            nextAnchorId,
            salt
          )
        )
      ),
      "Next version proof is not valid"
    );

  }
  /**
   * @dev Checks that the document has no other token
   * minted in this registry for the provided document
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param tokenId uint256 The ID for the token to be minted
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireOneTokenPerDocument(
    bytes32 signingRoot,
    uint256 tokenId,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    // Reconstruct the property
    // the property format: nfts[registryAddress]
    bytes memory property_ = abi.encodePacked(
      NFTS,
      _getOwnAddress(),
      hex"000000000000000000000000" // precise proofs generates a bytes32 hex
    );
    require(
      MerkleProof.verifySha256(
        proof,
          signingRoot,
        sha256(abi.encodePacked(property_, tokenId, salt))
      ),
      "Token uniqueness proof is not valid"
    );

  }

  /**
   * @dev Checks that the document has a read rule set
   * using precise proofs and extract the index of the role
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param property bytes property for leaf construction
   * @param value bytes value for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   * @return bytes8 the index of the read rule
   */
  function _requireReadRole(
    bytes32 signingRoot,
    bytes memory property,
    bytes memory value,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  pure
  returns (bytes8 readRuleIndex)
  {
    // Extract the indexes
    bytes8 readRuleIndex_ = Utilities.extractIndex(property, 8);
    bytes8 readRuleRoleIndex_ = Utilities.extractIndex(property, 20);
    // Reconstruct the property
    // the property format: read_rules[readRuleIndex].roles[readRuleRoleIndex]
    bytes memory property_ = abi.encodePacked(
      READ_RULES,
      readRuleIndex_,
      READ_RULES_ROLES,
      readRuleRoleIndex_
    );

    require(
      MerkleProof.verifySha256(
        proof,
          signingRoot,
        sha256(
          abi.encodePacked(
            property_,
            value,
            salt
          )
        )
      ),
      "Read Rule proof is not valid"
    );

    return readRuleIndex_;
  }

  /**
   * @dev Checks that the document has a read action set
   * to the read role using precise proofs
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param readRuleIndex bytes8 read rule index used for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireReadAction(
    bytes32 signingRoot,
    bytes8 readRuleIndex,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  pure
  {
    // Reconstruct the property
    // the property format: read_rules[readRuleIndex].action
    bytes memory property_ = abi.encodePacked(
      READ_RULES,
      readRuleIndex,
      READ_RULES_ACTION
    );

    require(
      MerkleProof.verifySha256(
        proof,
          signingRoot,
        sha256(
          abi.encodePacked(
            property_,
            READ_ACTION_VALUE, // Read action value has to be 1
            salt
          )
        )
      ),
      "Read Action is not valid"
    );
  }

  /**
   * @dev Checks that provided document read role is assigned to the
   * token to me minted
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param tokenId uint256 The ID for the minted token
   * @param property bytes property for leaf construction
   * @param roleIndex bytes the value of the defined read role
   * used to contract the property for precise proofs
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireTokenHasRole(
    bytes32 signingRoot,
    uint256 tokenId,
    bytes memory property,
    bytes memory roleIndex,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    // Extract the token index
    bytes8 tokenIndex_ = Utilities.extractIndex(property, 44);
    // Reconstruct the property
    // the property format: roles[roleIndex].nfts[tokenIndex]
    bytes memory property_ = abi.encodePacked(
      ROLES,
      roleIndex,
      ROLES_NFTS,
      tokenIndex_
    );
    // Reconstruct the value
    bytes memory value_ = abi.encodePacked(
      _getOwnAddress(),
      tokenId
    );

    require(
      MerkleProof.verifySha256(
        proof,
          signingRoot,
        sha256(abi.encodePacked(property_, value_, salt))
      ),
      "Token Role not valid"
    );
  }

  /**
   * @dev Checks that provided document is signed by the given identity
   * and validates and checks if the public key used is a valid SIGNING_KEY
   * @param documentRoot bytes32 the anchored document root
   * @param anchoredBlock uint32 block number for when the document root was anchored
   * @param identity address Identity that signed the document
   * @param signingRoot bytes32 hash of all invoice fields which is signed
   * @param singingRootProof bytes32[] proofs for signing root
   * @param signature bytes The signature
   * used to contract the property for precise proofs
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */

  function _requireSignedByIdentity(
    bytes32 documentRoot,
    uint32 anchoredBlock,
    address identity,
    bytes32 signingRoot,
    bytes32[] memory singingRootProof,
    bytes memory signature,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    require(
      singingRootProof.length == 1,
      "SigningRoot can have only one sibling"
    );

    require(
      MerkleProof.verifySha256(
        singingRootProof[0],
        documentRoot,
        signingRoot
      ),
      "Signing Root not part of the document"
    );

    // Extract the public key from the signature
    bytes32 pbKey_ = bytes32(
      uint256(
        signingRoot.toEthSignedMessageHash().recover(signature)
      )
    );

    // Reconstruct the precise proof property based on the provided identity
    // and the extracted public key
    bytes memory property_ = abi.encodePacked(
      SIGNATURE_TREE_SIGNATURES,
      identity,
      pbKey_,
      SIGNATURE_TREE_SIGNATURES_SIGNATURE
    );


    // Check with precise proofs if the signature is part of the documentRoot
    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(abi.encodePacked(property_, signature, salt))
      ),
      "Provided signature is not part of the document root"
    );

    // Check if the public key has a signature purpose on the provided identity
    require(
      _getIdentity(identity).keyHasPurpose(pbKey_, SIGNING_PURPOSE),
      "Signature key not valid"
    );

    // If key is revoked anchor must be older the the key revocation
    (, , uint32 revokedAt_) = _getIdentity(identity).getKey(pbKey_);
    if (revokedAt_ > 0) {
      require(
        anchoredBlock < revokedAt_,
        "Document signed with a revoked key"
      );
    }

  }

}
