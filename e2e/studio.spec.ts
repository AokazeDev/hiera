import { expect, test } from "@playwright/test";
import { source as axeSource } from "axe-core";

const backup = JSON.stringify({
  groups: { default: { nodes: [] } },
  users: {},
});

test("importa, aplica, deshace y exporta un backup sin salir del navegador", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.locator('input[type="file"]').setInputFiles({
    name: "hiera-fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });

  await expect(
    page.getByRole("button", { name: /^default 0$/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /catálogo/i }).click();
  await page
    .getByRole("checkbox", { name: /authme\.admin\.accounts/i })
    .check();
  await page.getByRole("button", { name: /aplicar concesiones/i }).click();
  await expect(page.getByRole("button", { name: /deshacer:/i })).toBeEnabled();

  await page.getByRole("button", { name: /deshacer:/i }).click();
  await expect(page.getByText(/deshecho:/i)).toBeVisible();

  await page.getByRole("button", { name: /exportar json/i }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Revisar cambios locales",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /descargar json/i }).click();
  expect((await download).suggestedFilename()).toBe(
    "hiera-luckperms-backup.json",
  );
});

test("la landing y el estudio no tienen infracciones axe críticas", async ({
  page,
}) => {
  for (const route of ["/", "/studio"]) {
    await page.goto(route);
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const axe = (window as Window & { axe: typeof import("axe-core") }).axe;
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      });
      return result.violations.map(({ id, impact }) => ({ id, impact }));
    });
    expect(violations).toEqual([]);
  }
});

test("las vistas públicas caben en móvil y respetan el presupuesto inicial de JavaScript", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const route of ["/", "/studio"]) {
    await page.goto(route);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    const scriptBytes = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter(
          (entry): entry is PerformanceResourceTiming =>
            entry instanceof PerformanceResourceTiming &&
            entry.initiatorType === "script",
        )
        .reduce((total, entry) => total + entry.transferSize, 0),
    );
    expect(scriptBytes).toBeLessThan(1_000_000);
  }
});
