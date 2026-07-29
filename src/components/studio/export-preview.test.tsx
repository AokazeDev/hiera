import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ExportPreview } from "@/components/studio/export-preview";
import type { LuckPermsBackup } from "@/lib/permissions";

const original: LuckPermsBackup = {
  groups: { default: { nodes: [] } },
};

test("confirma el diff y transmite la opción de orden estable al exportar", async () => {
  const user = userEvent.setup();
  const onExport = vi.fn();
  const backup: LuckPermsBackup = {
    groups: {
      default: {
        nodes: [{ type: "permission", key: "example.use", value: true }],
      },
    },
  };

  render(
    <ExportPreview original={original} backup={backup} onExport={onExport} />,
  );

  await user.click(screen.getByRole("button", { name: /exportar json/i }));
  expect(
    screen.getByText(/cambios respecto al backup importado/i),
  ).toBeInTheDocument();

  await user.click(screen.getByLabelText(/orden estable para git/i));
  await user.click(screen.getByRole("button", { name: /descargar json/i }));

  expect(onExport).toHaveBeenCalledWith(true);
});
