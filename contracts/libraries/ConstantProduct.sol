// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library ConstantProduct {
    function check(uint256 newX, uint256 newYZ, uint256 x, uint256 yz) internal pure {
        (uint256 newProd0, uint256 newProd1) = mul512(newX, newYZ);
        (uint256 prod0, uint256 prod1) = mul512(x, yz);

        require(newProd1 >= prod1, "ConstantProduct :: check : invariance");
        if (newProd1 == prod1) require(newProd0 >= prod0, "ConstantProduct :: check : invariance");
        
    }

    function mul512(uint256 a, uint256 b) private pure returns (uint256 prod0, uint256 prod1) {
        // 512-bit multiply [prod1 prod0] = a * b
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remainder Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }
    }
}