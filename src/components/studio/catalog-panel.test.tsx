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
      catalog={authMeReloaded}
      groupName="default"
      onApply={onApply}
      dragRequest={null}
      onStartPermissionDrag={vi.fn()}
      onEndPermissionDrag={vi.fn()}
      onApplyDroppedPermission={vi.fn()}
      onCloseDragRequest={vi.fn()}
    />,
  );

  await user.type(
    screen.getByPlaceholderText(/buscar nodo o descripción/i),
    "authme.admin.accounts",
  );
  await user.click(
    screen.getByRole("checkbox", { name: /authme\.admin\.accounts/i }),
  );

  expect(
    screen.getByText(/añadir authme\.admin\.accounts/i),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: /aplicar concesiones/i }),
  );

  expect(onApply).toHaveBeenCalledWith(
    ["authme.admin.accounts"],
    ["default"],
    "grant",
  );
});
