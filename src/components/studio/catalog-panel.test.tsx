import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CatalogPanel } from "@/components/studio/catalog-panel";
import { authMeReloaded, type LuckPermsBackup } from "@/lib/permissions";

const backup: LuckPermsBackup = {
  groups: { default: { nodes: [] } },
};

test("previsualiza y aplica una selección del catálogo al grupo elegido", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();

  render(
    <CatalogPanel
      backup={backup}
      catalogs={[authMeReloaded]}
      selectedGroup="default"
      onApply={onApply}
    />,
  );

  await user.click(screen.getByRole("button", { name: /authme reloaded/i }));
  await user.type(
    screen.getByPlaceholderText(/buscar permiso o descripción/i),
    "authme.admin.accounts",
  );
  await user.click(
    screen.getByLabelText(/añadir authme\.admin\.accounts a un grupo/i),
  );
  await user.click(screen.getByRole("button", { name: /añadir a default/i }));
  await user.click(
    screen.getByRole("button", { name: /confirmar concesión/i }),
  );

  expect(onApply).toHaveBeenCalledWith(
    ["authme.admin.accounts"],
    ["default"],
    "grant",
  );
});
