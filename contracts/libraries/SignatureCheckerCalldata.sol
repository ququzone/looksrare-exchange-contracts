// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Errors
import {SignatureParameterSInvalid, SignatureParameterVInvalid, SignatureLengthInvalid} from "./SignatureCheckerErrors.sol";

/**
 * @title SignatureChecker
 * @notice This library allows verification of signatures for both EOAs and contracts.
 */
library SignatureCheckerCalldata {
    /**
     * @notice This function is internal and splits a signature into r, s, v outputs.
     * @param signature A 64 or 65 bytes signature
     * @return r The r output of the signature
     * @return s The s output of the signature
     * @return v The recovery identifier, must be 27 or 28
     */
    function splitSignature(bytes calldata signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        uint256 length = signature.length;
        if (length == 65) {
            assembly {
                r := calldataload(signature.offset)
                s := calldataload(add(signature.offset, 0x20))
                v := byte(0, calldataload(add(signature.offset, 0x40)))
            }
        } else if (length == 64) {
            assembly {
                r := calldataload(signature.offset)
                let vs := calldataload(add(signature.offset, 0x20))
                s := and(vs, 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
                v := add(shr(255, vs), 27)
            }
        } else {
            revert SignatureLengthInvalid(length);
        }

        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert SignatureParameterSInvalid();
        }

        if (v != 27 && v != 28) {
            revert SignatureParameterVInvalid(v);
        }
    }
}
