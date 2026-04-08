// src/tui/confirm.tsx

import React from "react";
import { Box, Text, useInput } from "ink";

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({ message, onConfirm, onCancel }: ConfirmProps) {
  useInput((input) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N" || input === "q" || input === "escape") {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{message}</Text>
      <Box marginTop={1}>
        <Text color="green">[Y]</Text>
        <Text>es  </Text>
        <Text color="red">[N]</Text>
        <Text>o</Text>
      </Box>
    </Box>
  );
}
