import React, { useState, useEffect } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { validateName, handleHttpErrorMessages, appendWorkspaceId } from '@/_helpers/utils';
import _ from 'lodash';

export const EditOrganization = ({ showEditOrg, setShowEditOrg, currentValue }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [fields, setFields] = useState({ name: { value: '', error: '' }, slug: { value: null, error: '' } });
  const [slugProgress, setSlugProgress] = useState(false);
  const [isDisabled, setDisabled] = useState(true);
  const { t } = useTranslation();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(
    () =>
      setFields({
        name: {
          value: currentValue?.name,
        },
        slug: {
          value: currentValue?.slug,
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    currentValue
  );

  const editOrganization = () => {
    let emptyError = false;
    const fieldsTemp = fields;
    Object.keys(fields).map((key) => {
      if (!fields?.[key]?.value?.trim()) {
        fieldsTemp[key] = {
          error: `Workspace ${key} can't be empty`,
        };
        emptyError = true;
      }
    });
    setFields({ ...fields, ...fieldsTemp });

    if (!emptyError && !Object.keys(fields).find((key) => !_.isEmpty(fields[key].error))) {
      setIsCreating(true);
      const data = {
        ...(fields?.name?.value && fields?.name?.value !== currentValue?.name && { name: fields.name.value.trim() }),
        ...(fields?.slug?.value && fields?.slug?.value !== currentValue?.slug && { slug: fields.slug.value.trim() }),
      };
      organizationService.editOrganization(data).then(
        () => {
          toast.success('Workspace updated');
          setIsCreating(false);
          setShowEditOrg(false);
          const newPath = appendWorkspaceId(fields['slug'].value, location.pathname, true);
          window.history.replaceState(null, null, newPath);
          window.location.reload();
        },
        (error) => {
          handleHttpErrorMessages(error, 'Workspace');
          setIsCreating(false);
        }
      );
    }
  };

  const handleInputChange = (value, field) => {
    const trimmedValue = value?.trim();
    //reset fields
    setFields({
      ...fields,
      [field]: {
        ...fields[field],
        error: null,
      },
    });
    const error = validateName(
      value,
      `Workspace ${field}`,
      false,
      !(field === 'slug'),
      !(field === 'slug'),
      field === 'slug'
    );
    setFields({
      ...fields,
      [field]: {
        value,
        error: error?.errorMsg,
      },
    });

    if (error?.status) {
      if (field === 'name') {
        setDisabled(trimmedValue === currentValue?.name && fields?.slug?.value === currentValue?.slug);
      } else {
        setDisabled(trimmedValue === currentValue?.slug && fields?.name?.value === currentValue?.name);
      }
      return;
    }
    setDisabled(!error?.status);
  };

  const closeModal = () => {
    setFields({ name: { value: currentValue?.name, error: '' }, slug: { value: currentValue?.slug, error: '' } });
    setShowEditOrg(false);
    setDisabled(true);
  };

  const delayedSlugChange = _.debounce((value, field) => {
    handleInputChange(value, field);
    setSlugProgress(false);
  }, 500);

  return (
    <AlertDialog
      show={showEditOrg}
      closeModal={closeModal}
      title={t('header.organization.editWorkspace', 'Edit workspace')}
      checkForBackground={false}
    >
      <div className="workspace-folder-modal">
        <div className="row">
          <div className="col modal-main tj-app-input">
            <label>Workspace name</label>
            <input
              type="text"
              onChange={(e) => handleInputChange(e.target.value, 'name')}
              className="form-control"
              placeholder={t('header.organization.workspaceName', 'workspace name')}
              disabled={isCreating}
              maxLength={50}
              defaultValue={fields['name']?.value}
              data-cy="workspace-name-input-field"
              autoFocus
            />
            <label className="label tj-input-error">{fields['name']?.error || ''}</label>
          </div>
        </div>
        <div className="row">
          <div className="col tj-app-input input-with-icon">
            <label>Unique workspace slug</label>
            <input
              type="text"
              className={`form-control is-valid`}
              placeholder={t('header.organization.workspaceSlug', 'unique workspace slug')}
              disabled={isCreating}
              maxLength={50}
              onChange={(e) => {
                setSlugProgress(true);
                e.persist();
                delayedSlugChange(e.target.value, 'slug');
              }}
              defaultValue={fields['slug']?.value}
              data-cy="workspace-slug-input-field"
              autoFocusfields
            />
            {fields?.['slug']?.value !== currentValue?.slug && !fields['slug'].error && (
              <div className="icon-container">
                <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14.256 0.244078C14.5814 0.569515 14.5814 1.09715 14.256 1.42259L5.92263 9.75592C5.59719 10.0814 5.06956 10.0814 4.74412 9.75592L0.577452 5.58926C0.252015 5.26382 0.252015 4.73618 0.577452 4.41074C0.902889 4.08531 1.43053 4.08531 1.75596 4.41074L5.33337 7.98816L13.0775 0.244078C13.4029 -0.0813592 13.9305 -0.0813592 14.256 0.244078Z"
                    fill="#46A758"
                  />
                </svg>
              </div>
            )}
            {fields['slug']?.error ? (
              <label className="label tj-input-error">{fields['slug']?.error || ''}</label>
            ) : fields?.['slug']?.value !== currentValue?.slug ? (
              <label className="label label-success">{`Slug accepted!`}</label>
            ) : (
              <label className="label label-info">{`URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens`}</label>
            )}
          </div>
        </div>
        <div className="row mb-3">
          <div className="col modal-main tj-app-input">
            <label>Workspace link</label>
            <div className={`tj-text-input break-all ${darkMode ? 'dark' : ''}`}>
              {!slugProgress ? (
                `${window.public_config?.TOOLJET_HOST}/${fields['slug']?.value || ''}`
              ) : (
                <div className="d-flex gap-2">
                  <div class="spinner-border text-secondary workspace-spinner" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  {`Updating link`}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-end gap-2">
            <ButtonSolid variant="secondary" onClick={closeModal} className="cancel-btn">
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>
            <ButtonSolid isLoading={isCreating} disabled={isCreating || isDisabled} onClick={editOrganization}>
              {t('globals.save', 'Save')}
            </ButtonSolid>
          </div>
        </div>
      </div>
    </AlertDialog>
  );
};
