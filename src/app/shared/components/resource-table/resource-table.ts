import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Field } from '../../../features/root/models/resource-table.model';
import { ToastAlert } from '../toast-alert/toast-alert';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type FieldValue = string | number | boolean;
type RowForm = FormGroup<Record<string, FormControl<FieldValue>>>;

@Component({
  selector: 'app-resource-table',
  imports: [ReactiveFormsModule, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resource-table.html',
})
export class ResourceTable<T extends { id: string }> {
  private readonly fb = inject(NonNullableFormBuilder);

  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly heading = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly initial = input.required<T[]>();
  readonly fields = input.required<Field<T>[]>();
  readonly searchKeys = input.required<(keyof T & string)[]>();
  readonly primaryKey = input.required<keyof T & string>();
  /** Se informado, exibe o botão "Novo" e usa a função para criar o registro base. */
  readonly newItem = input<(() => T) | null>(null);

  /**
   * false (padrão): a tabela altera `rows` localmente e mostra o próprio toast (modo mock).
   * true: a tabela só emite os outputs; quem usa é dono dos dados (passa a lista em `initial`)
   * e do toast.
   */
  readonly remote = input(false);
  /** Esconde o botão de editar quando a entidade não tem update. */
  readonly canEdit = input(true);
  /** Esconde o botão de excluir quando a tela é só leitura. */
  readonly canDelete = input(true);

  // ── Outputs (usados quando `remote` = true) ───────────────────────────────
  readonly create = output<T>();
  readonly update = output<T>();
  readonly delete = output<T>();

  // ── Estado ────────────────────────────────────────────────────────────────
  protected readonly rows = linkedSignal<T[]>(() => this.initial());
  protected readonly query = signal('');

  protected readonly editing = signal<T | null>(null);
  protected readonly isNew = signal(false);
  protected readonly form = signal<RowForm | null>(null);
  protected readonly toDelete = signal<T | null>(null);
  protected readonly toast = signal<{ message: string; type: ToastType } | null>(null);

  private readonly editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');
  private readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');

  // ── Derivados ─────────────────────────────────────────────────────────────
  protected readonly visibleFields = computed(() => this.fields().filter((f) => !f.hideInTable));
  /** A coluna "Ações" só existe se houver ao menos uma ação disponível. */
  protected readonly showActions = computed(() => this.canEdit() || this.canDelete());
  protected readonly colSpan = computed(() => this.visibleFields().length + (this.showActions() ? 1 : 0));
  /** Campos que aparecem no formulário de criar/editar (exclui os `hideInForm`). */
  protected readonly formFields = computed(() => this.fields().filter((f) => !f.hideInForm));

  protected readonly filtered = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return this.rows();
    const keys = this.searchKeys();
    return this.rows().filter((r) => keys.some((k) => String(r[k]).toLowerCase().includes(term)));
  });

  // ── Busca ─────────────────────────────────────────────────────────────────
  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  // ── Criar / editar ────────────────────────────────────────────────────────
  protected openNew(): void {
    const factory = this.newItem();
    if (!factory) return;
    this.openEditor(factory(), true);
  }

  protected openEdit(row: T): void {
    if (!this.canEdit()) return;
    this.openEditor({ ...row }, false);
  }

  private openEditor(row: T, isNew: boolean): void {
    this.isNew.set(isNew);
    this.editing.set(row);
    this.form.set(this.buildForm(row));
    this.editDialog().nativeElement.showModal();
  }

  private buildForm(row: T): RowForm {
    const controls: Record<string, FormControl<FieldValue>> = {};
    const primary = this.primaryKey();

    for (const f of this.formFields()) {
      const validators = [];
      if (f.key === primary) validators.push(Validators.required);
      if (f.type === 'number') validators.push(Validators.min(0));
      controls[f.key] = this.fb.control<FieldValue>(this.initialValue(row, f), validators);
    }
    return this.fb.group(controls);
  }

  private initialValue(row: T, f: Field<T>): FieldValue {
    const value = row[f.key];
    if (f.type === 'boolean') return Boolean(value);
    if (f.type === 'number') return Number(value ?? 0);
    return String(value ?? '');
  }

  protected save(): void {
    const form = this.form();
    const current = this.editing();
    if (!form || !current) return;

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const updated = { ...current, ...form.getRawValue() } as T;
    const wasNew = this.isNew();

    if (this.remote()) {
      // Quem usa decide o que fazer (chamar service, toast, recarregar lista).
      if (wasNew) this.create.emit(updated);
      else this.update.emit(updated);
      this.closeEdit();
      return;
    }

    this.rows.update((prev) =>
      wasNew ? [updated, ...prev] : prev.map((r) => (r.id === updated.id ? updated : r)),
    );
    this.showToast(wasNew ? 'Registro criado' : 'Registro atualizado', 'success');
    this.closeEdit();
  }

  protected closeEdit(): void {
    this.editDialog().nativeElement.close();
  }

  /** Disparado pelo evento `close` do <dialog> (botão, ESC ou backdrop). */
  protected onEditClosed(): void {
    this.editing.set(null);
    this.form.set(null);
  }

  protected fieldInvalid(key: string): boolean {
    const control = this.form()?.get(key);
    return !!(control?.invalid && control.touched);
  }

  // ── Excluir ───────────────────────────────────────────────────────────────
  protected requestDelete(row: T): void {
    this.toDelete.set(row);
    this.deleteDialog().nativeElement.showModal();
  }

  protected confirmDelete(): void {
    const target = this.toDelete();
    if (!target) return;

    if (this.remote()) {
      this.delete.emit(target);
      this.closeDelete();
      return;
    }

    this.rows.update((prev) => prev.filter((r) => r.id !== target.id));
    this.showToast(`"${this.primaryLabel(target)}" removido`, 'success');
    this.closeDelete();
  }

  protected closeDelete(): void {
    this.deleteDialog().nativeElement.close();
  }

  protected onDeleteClosed(): void {
    this.toDelete.set(null);
  }

  // ── Helpers de exibição ───────────────────────────────────────────────────
  protected primaryLabel(row: T): string {
    return String(row[this.primaryKey()]);
  }

  protected cellText(row: T, f: Field<T>): string {
    if (f.format) return f.format(row);
    if (f.type === 'boolean') return row[f.key] ? 'Sim' : 'Não';
    return String(row[f.key]);
  }

  protected progressValue(row: T, f: Field<T>): number {
    return Number(row[f.key]) || 0;
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'ativo':
        return 'badge badge-soft badge-success';
      case 'suspenso':
        return 'badge badge-soft badge-error';
      default:
        return 'badge badge-soft badge-primary';
    }
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });
  }
}