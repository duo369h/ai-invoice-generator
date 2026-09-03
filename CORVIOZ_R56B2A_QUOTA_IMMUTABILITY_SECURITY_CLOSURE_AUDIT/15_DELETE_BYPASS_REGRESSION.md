# Delete-bypass regression

The deterministic local fixture and real Sandbox runtime both verify that deleting a business document never decrements the immutable creation-event count. All finite plan boundaries pass.

`DELETE_RESTORES_CAPACITY=NO`.
