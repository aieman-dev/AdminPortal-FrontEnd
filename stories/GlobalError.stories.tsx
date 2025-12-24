import type { Meta, StoryObj } from '@storybook/react';
import GlobalError from '../app/global-error'; // Adjust path if needed

const meta = {
  title: 'System/GlobalError',
  component: GlobalError,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GlobalError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: new Error("Simulation of a system crash"),
    reset: () => console.log("Reset clicked"),
  },
};