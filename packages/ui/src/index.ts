// Barrel export do design system @alicercei/ui.
// Cada componente extraído do legado (whale-ui) ganha sua linha aqui,
// no mesmo commit em que é movido (ver PLANO-EXECUCAO.md, passo 4.2).

export * from "./api/ui-api-client";
export * from "./animations/animations.global";

export * from "./avatar/avatar.component";
export * from "./button/button.component";
export * from "./calendar/calendar.component";
export * from "./confirmation-dialog/confirmation-dialog.component";
export * from "./confirmation-dialog/services/confirmation-dialog.service";
export * from "./dialog/dialog.component";
export * from "./dialog/dialog.service";
export * from "./dialog/directive/dialog-host.directive";
export * from "./dynamic-tabs/dynamic-tabs.component";
export * from "./input/input.component";
export * from "./loader/loader.service";
export * from "./masks/cnpj-cpf/cnpj-cpf.directive";
export * from "./masks/currency-mask/currency-mask.directive";
export * from "./masks/phone-mask/phone-mask.directive";
export * from "./select/select.component";
export * from "./skeleton-loader/skeleton-loader.component";
export * from "./table/table.component";
export * from "./table/table.service";
export * from "./textarea-custom/textarea-custom.component";
export * from "./toast/toast.component";
export * from "./toast/toast.service";
export * from "./uploader/uploader.component";
