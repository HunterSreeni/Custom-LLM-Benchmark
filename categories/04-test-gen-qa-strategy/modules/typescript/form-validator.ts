/**
 * Form validation state machine with typed fields.
 *
 * States: idle -> validating -> valid | invalid -> submitting -> submitted | error
 * Transitions are triggered by user actions: input, submit, reset.
 */

// ----- Types -----

export type FormState =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "submitting"
  | "submitted"
  | "error";

export interface FormFields {
  name: string;
  email: string; // TYPE LIE: annotation says string, but default is null at runtime
  password: string;
  confirmPassword: string;
}

export interface ValidationError {
  field: keyof FormFields;
  message: string;
}

export interface FormSnapshot {
  state: FormState;
  fields: FormFields;
  errors: ValidationError[];
  submitCount: number;
}

// ----- Validators -----

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: keyof FormFields, value: string): string | null {
  switch (field) {
    case "name":
      return value.trim().length < 2 ? "Name must be at least 2 characters" : null;
    case "email":
      // BUG: value can be null at runtime even though the type says string.
      // When the email field is optional and untouched, the default is null.
      // Calling .trim() on null throws a TypeError at runtime.
      return EMAIL_RE.test(value.trim()) ? null : "Invalid email address";
    case "password":
      return value.length < 8 ? "Password must be at least 8 characters" : null;
    case "confirmPassword":
      return null; // cross-field check happens in validateAll
    default:
      return null;
  }
}

function validateAll(fields: FormFields): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const key of Object.keys(fields) as (keyof FormFields)[]) {
    const msg = validateField(key, fields[key]);
    if (msg) errors.push({ field: key, message: msg });
  }

  if (fields.password !== fields.confirmPassword) {
    errors.push({ field: "confirmPassword", message: "Passwords do not match" });
  }

  return errors;
}

// ----- State Machine -----

export class FormValidator {
  private _state: FormState = "idle";
  private _fields: FormFields;
  private _errors: ValidationError[] = [];
  private _submitCount = 0;
  private _previousSnapshot: FormSnapshot | null = null;

  constructor(initial?: Partial<FormFields>) {
    // The default for email is null, disguised by the cast.
    // TypeScript is satisfied but runtime type is wrong.
    this._fields = {
      name: "",
      email: (initial?.email ?? null) as unknown as string, // <-- TYPE LIE: null cast to string
      password: "",
      confirmPassword: "",
      ...initial,
    } as FormFields;
  }

  get snapshot(): FormSnapshot {
    return {
      state: this._state,
      fields: { ...this._fields },
      errors: [...this._errors],
      submitCount: this._submitCount,
    };
  }

  /** Update a single field and trigger validation. */
  input(field: keyof FormFields, value: string): FormSnapshot {
    this._savePrevious();
    this._fields[field] = value;
    this._state = "validating";
    this._errors = validateAll(this._fields);
    this._state = this._errors.length === 0 ? "valid" : "invalid";
    return this.snapshot;
  }

  /** Attempt to submit the form. Returns snapshot with resulting state. */
  async submit(onSubmit: (fields: FormFields) => Promise<void>): Promise<FormSnapshot> {
    if (this._state !== "valid") {
      // Force a validation pass first
      this._errors = validateAll(this._fields);
      if (this._errors.length > 0) {
        this._state = "invalid";
        return this.snapshot;
      }
    }

    this._savePrevious();
    this._state = "submitting";
    this._submitCount += 1;

    try {
      await onSubmit({ ...this._fields });
      this._state = "submitted";
    } catch (err) {
      this._state = "error";
      this._errors = [
        { field: "name", message: err instanceof Error ? err.message : "Submission failed" },
      ];
    }

    return this.snapshot;
  }

  /** Reset the form to idle, optionally rolling back to the previous snapshot. */
  reset(rollback = false): FormSnapshot {
    if (rollback && this._previousSnapshot) {
      this._state = this._previousSnapshot.state;
      this._fields = { ...this._previousSnapshot.fields };
      this._errors = [...this._previousSnapshot.errors];
      this._submitCount = this._previousSnapshot.submitCount;
      this._previousSnapshot = null;
      return this.snapshot;
    }

    this._state = "idle";
    this._fields = {
      name: "",
      email: null as unknown as string, // same type lie on reset
      password: "",
      confirmPassword: "",
    };
    this._errors = [];
    this._previousSnapshot = null;
    return this.snapshot;
  }

  private _savePrevious(): void {
    this._previousSnapshot = this.snapshot;
  }
}
