import React, { useMemo, useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Radio, message } from "antd";
import dayjs from "dayjs";
import UiModal from "./UiModal";

const STATUS_OPTIONS = [
  { label: "À faire", value: "TODO" },
  { label: "En cours", value: "DOING" },
  { label: "En pause", value: "PAUSED" },
  { label: "Terminé", value: "DONE" },
];

const REPLY_OPTIONS = [
  { label: "Répondu", value: "REPLIED" },
  { label: "À répondre", value: "TO_REPLY" },
];

const sanitizePartners = (arr) =>
  Array.from(
    new Set(
      (Array.isArray(arr) ? arr : [])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    )
  );

export default function TaskEditModal({
  open,
  onClose,
  task,
  onPatch, // (id, payload) => Promise
  allowEditCreatedAt = true,
  allowEditLastMoveAt = false, // mets true si tu veux exposer lastMoveAt
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(() => {
    if (!task) return {};
    return {
      title: task.title || "",
      character: task.character || "",
      forum: task.forum || "",
      roleplayUrl: task.roleplayUrl || "",
      partners: task.partners || [],
      status: task.status || "TODO",
      replyState: task.replyState || "REPLIED",
      createdAt: task.createdAt ? dayjs(task.createdAt) : null,
      lastMoveAt: task.lastMoveAt ? dayjs(task.lastMoveAt) : null,
    };
  }, [task]);

  // 👉 IMPORTANT : re-pousse les valeurs dans le form à chaque ouverture / changement de task
  useEffect(() => {
    if (open && task) {
      form.setFieldsValue(initialValues);
    }
  }, [open, task, initialValues, form]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        title: values.title?.trim(),
        forum: values.forum?.trim() || undefined,
        roleplayUrl: values.roleplayUrl?.trim() || undefined,
        character: values.character?.trim() || undefined,
        partners: sanitizePartners(values.partners),
        status: values.status,
      };

      if (allowEditCreatedAt) {
        if (values.createdAt)
          payload.createdAt = values.createdAt.format("YYYY-MM-DD");
        else payload.createdAt = undefined; // ne change pas si vide
      }
      if (allowEditLastMoveAt) {
        if (values.lastMoveAt)
          payload.lastMoveAt = values.lastMoveAt.format("YYYY-MM-DD");
        else payload.lastMoveAt = undefined;
      }

      await onPatch?.(task._id, payload);
      message.success("Suivi mis à jour");
      onClose?.();
    } catch (e) {
      if (e?.errorFields) return; // erreurs de formulaire
      console.error(e);
      message.error(e?.message || "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  if (!task) return null;

  return (
    <UiModal
      open={open}
      onClose={onClose}
      title="Éditer le suivi"
      primary={{
        label: "Enregistrer",
        onClick: submit,
        disabled: saving,
        loading: saving,
      }}
      secondary={{ label: "Annuler", onClick: onClose, disabled: saving }}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label="Titre du RP"
          name="title"
          rules={[
            { required: true, message: "Le titre est requis" },
            { min: 2, message: "Le titre est trop court" },
          ]}
        >
          <Input placeholder="Ex: Nuit à la taverne" />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item label="Personnage" name="character">
            <Input placeholder="Nom du personnage" />
          </Form.Item>
          <Form.Item label="Forum" name="forum">
            <Input placeholder="Nom du forum" />
          </Form.Item>
        </div>

        <Form.Item
          label="Lien du RP"
          name="roleplayUrl"
          rules={[
            () => ({
              validator(_, value) {
                if (!value || String(value).trim() === "")
                  return Promise.resolve();
                try {
                  const u = new URL(value);
                  if (!/^https?:$/.test(u.protocol)) {
                    return Promise.reject(
                      new Error(
                        "Le lien doit commencer par http:// ou https://"
                      )
                    );
                  }
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error("Lien invalide"));
                }
              },
            }),
          ]}
        >
          <Input placeholder="https://…" inputMode="url" />
        </Form.Item>

        <Form.Item label="Partenaires" name="partners">
          <Select
            mode="tags"
            placeholder="Ajoute des partenaires"
            tokenSeparators={[","]}
            onChange={(vals) => {
              const sanitized = sanitizePartners(vals);
              if (sanitized.length !== (vals || []).length) {
                form.setFieldsValue({ partners: sanitized });
              }
            }}
            open={false}
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item label="Statut" name="status">
            <Radio.Group
              options={STATUS_OPTIONS}
              optionType="button"
              buttonStyle="solid"
            />
          </Form.Item>
        </div>

        {allowEditCreatedAt && (
          <Form.Item label="Date de création" name="createdAt">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Choisir une date…"
              allowClear
              disabledDate={(current) =>
                current && current > dayjs().endOf("day")
              } // futur interdit (cohérent avec backend)
            />
          </Form.Item>
        )}

        {allowEditLastMoveAt && (
          <Form.Item label="Dernier mouvement" name="lastMoveAt">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Choisir une date…"
              allowClear
            />
          </Form.Item>
        )}
      </Form>
    </UiModal>
  );
}
