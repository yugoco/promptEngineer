// --- Compteurs et options ---
let fieldCounters = {
    starting: { role: 1, constraint: 1 },
    tree: { role: 1, constraint: 1 }
};

let actionBlockCounters = {
    starting: 1,
    tree: 1
};

const articleOptions = {
    persona: ['Act as a', 'I am a'],
    subject: ['a', 'an', 'the', 'this', 'a few', 'several'],
    receiver: ['for', 'to', 'aimed at'],
    context: ['that', 'which', 'who', 'with', 'having']
};

/**
 * Crée un menu déroulant pour les articles (a, an, the, etc.).
 * @param {string} type - Le type d'article (persona, subject, receiver, context).
 * @param {number} blockId - L'ID du bloc d'action ou du champ.
 * @param {string|null} currentValue - La valeur actuellement sélectionnée.
 * @returns {string} Le HTML du menu déroulant.
 */
function createDropdown(type, blockId, currentValue = null) {
    const options = articleOptions[type] || [];
    const defaultValue = currentValue || options[0];

    let optionsHtml = '';
    options.forEach(option => {
        const selected = option === defaultValue ? 'selected' : '';
        optionsHtml += `<option value="${option}" ${selected}>${option}</option>`;
    });

    return `<select class="form-select article-dropdown" style="max-width: 110px;" onchange="updateArticle('${type}', ${blockId}, this.value)">${optionsHtml}</select>`;
}

/**
 * Met à jour l'article sélectionné (le DOM est mis à jour automatiquement).
 * @param {string} type - Le type d'article.
 * @param {number} blockId - L'ID du bloc.
 * @param {string} newValue - La nouvelle valeur de l'article.
 */
function updateArticle(type, blockId, newValue) {
    // DOM is automatically updated
}

/**
 * Ajoute un nouveau champ (persona ou contrainte) à une section donnée.
 * @param {string} prefix - Le préfixe de la section ('starting' ou 'tree').
 * @param {string} fieldType - Le type de champ à ajouter ('role' ou 'constraint').
 */
function addField(prefix, fieldType) {
    const count = ++fieldCounters[prefix][fieldType];
    if (fieldType === 'role') {
        const group = document.getElementById(`${prefix}_roleGroup`);
        const newField = document.createElement('div');
        newField.className = 'row';
        let inputHtml = '';
        if (prefix === 'starting' && count > 1) { // Pour les personas ajoutés dans 'starting'
            inputHtml = `
                <span class="input-group-text">and a</span>
                <input type="text" class="form-control" id="${prefix}_role_${count}" placeholder="Define another persona...">
            `;
        } else { // Pour le premier persona ou les personas de 'tree' (qui n'ont pas de bouton add)
            inputHtml = `
                ${createDropdown('persona', count)}
                <input type="text" class="form-control" id="${prefix}_role_${count}" placeholder="Define a persona...">
            `;
        }
        newField.innerHTML = `
            <div class="col">
                <div class="input-group field m-2">
                    ${inputHtml}
                    <button type="button" class="btn btn-outline-secondary btn-delete" onclick="this.closest('.row').remove()">✕</button>
                </div>
            </div>`;
        group.appendChild(newField);
    } else if (fieldType === 'constraint') {
        const container = document.getElementById(`${prefix}_constraintsContainer`);
        // Crée un nouveau div pour le groupe de sous-champs afin de maintenir la cohérence de la structure
        const newSubFieldGroup = document.createElement('div');
        newSubFieldGroup.className = 'sub-field-group mb-2'; // Assurez-vous d'avoir cette classe

        newSubFieldGroup.innerHTML = `
            <div class="input-group field">
                <span class="input-group-text">I want</span>
                <input type="text" class="form-control" id="${prefix}_constraint_${count}" placeholder="...">
                <button type="button" class="btn btn-outline-secondary btn-delete" onclick="this.closest('.sub-field-group').remove()">✕</button>
            </div>`;
        container.appendChild(newSubFieldGroup); // Ajoute le nouveau groupe de sous-champs
    }
}

/**
 * Ajoute un nouveau bloc d'action à une section donnée.
 * @param {string} prefix - Le préfixe de la section ('starting' ou 'tree').
 */
function addActionBlock(prefix) {
    const count = ++actionBlockCounters[prefix];
    const container = document.getElementById(`${prefix}_actionsContainer`);
    const block = document.createElement('div');
    block.className = 'action-block';
    block.id = `${prefix}_actionBlock_${count}`;
    block.innerHTML = `
        <div class="action-block-header mb-2">
            <span class="action-block-title">Task ${count}</span>
            <button type="button" class="btn btn-outline-secondary btn-delete ms-2" onclick="deleteActionBlock('${prefix}', ${count})">✕ Delete block</button>
        </div>
        <div class="container">
            ${['action', 'subject', 'receiver', 'context'].map((type, i) => `
                <div class="sub-field-group mb-2">
                    <div class="input-group field">
                        ${type === 'action' ? `<span class="input-group-text" id="${prefix}_${type}Addon_${count}">to</span>` : createDropdown(type, count)}
                        <input type="text" class="form-control" id="${prefix}_${type}_${count}_1" placeholder="...">
                    </div>
                </div>`).join('')}
        </div>`;
    container.appendChild(block);
    updateDeleteButtonsState(prefix);
}

/**
 * Supprime un bloc d'action spécifique.
 * @param {string} prefix - Le préfixe de la section.
 * @param {number} blockId - L'ID du bloc à supprimer.
 */
function deleteActionBlock(prefix, blockId) {
    const block = document.getElementById(`${prefix}_actionBlock_${blockId}`);
    if (block) block.remove();
    reindexActionBlocks(prefix); // Appel de la nouvelle fonction de réindexation
    updateDeleteButtonsState(prefix);
}

/**
 * Réindexe tous les blocs d'action d'une section donnée après une suppression.
 * Met à jour les titres (Task X), les IDs des blocs et des champs internes,
 * ainsi que les gestionnaires d'événements onclick des boutons de suppression.
 * @param {string} prefix - Le préfixe de la section ('starting' ou 'tree').
 */
function reindexActionBlocks(prefix) {
    const container = document.getElementById(`${prefix}_actionsContainer`);
    const actionBlocks = container.querySelectorAll('.action-block');
    actionBlocks.forEach((block, index) => {
        const oldBlockId = block.id.split('_').pop(); // Récupère l'ancien ID du bloc
        const newBlockId = index + 1; // Le nouvel ID séquentiel

        // 1. Mise à jour du titre du bloc (ex: "Task 1", "Task 2")
        const titleSpan = block.querySelector('.action-block-title');
        if (titleSpan) {
            titleSpan.textContent = `Task ${newBlockId}`;
        }

        // 2. Mise à jour de l'ID du bloc lui-même
        block.id = `${prefix}_actionBlock_${newBlockId}`;

        // 3. Mise à jour des IDs des éléments enfants (inputs et spans d'addon)
        // C'est crucial pour que getActionBlocks puisse récupérer les bonnes valeurs
        const fieldsToUpdate = ['action', 'subject', 'receiver', 'context'];
        fieldsToUpdate.forEach(field => {
            // Pour les inputs
            const inputElement = block.querySelector(`#${prefix}_${field}_${oldBlockId}_1`);
            if (inputElement) {
                inputElement.id = `${prefix}_${field}_${newBlockId}_1`;
            }
            // Pour les spans d'addon (si elles existent)
            const addonElement = block.querySelector(`#${prefix}_${field}Addon_${oldBlockId}`);
            if (addonElement) {
                addonElement.id = `${prefix}_${field}Addon_${newBlockId}`;
            }
        });

        // 4. Mise à jour de l'attribut onclick du bouton de suppression du bloc
        const deleteButton = block.querySelector('.btn-delete');
        if (deleteButton) {
            deleteButton.setAttribute('onclick', `deleteActionBlock('${prefix}', ${newBlockId})`);
        }
    });

    // 5. Mise à jour du compteur global pour que l'ajout de nouveaux blocs continue la séquence
    actionBlockCounters[prefix] = actionBlocks.length;
}

/**
 * Met à jour l'état des boutons de suppression des blocs d'action.
 * Seul le dernier bloc d'action peut être supprimé.
 * @param {string} prefix - Le préfixe de la section.
 */
function updateDeleteButtonsState(prefix) {
    const blocks = document.querySelectorAll(`#${prefix}_actionsContainer .action-block`);
    let maxVisibleId = 0;
    blocks.forEach(block => {
        const id = parseInt(block.id.split('_').pop(), 10);
        if (id > maxVisibleId) maxVisibleId = id;
    });
    const deleteButtons = document.querySelectorAll(`#${prefix}_actionsContainer .btn-delete`);
    deleteButtons.forEach(button => {
        const match = button.getAttribute('onclick')?.match(/deleteActionBlock\('\w+',\s*(\d+)\)/);
        if (match) {
            const id = parseInt(match[1], 10);
            button.disabled = id !== maxVisibleId;
        }
    });
}

/**
 * Active ou désactive un groupe de champs (ex: Personas).
 * @param {string} groupId - L'ID du groupe à basculer.
 */
function toggleGroup(groupId) {
    const group = document.getElementById(groupId);
    const toggleBtn = group.querySelector('.toggle');
    const addBtn = group.querySelector('.addBtn');

    const disabled = group.classList.toggle('disabled');
    toggleBtn.textContent = disabled ? '✗ Disabled' : '✓ Active';
    toggleBtn.classList.toggle('btn-secondary', disabled);
    toggleBtn.classList.toggle('active', !disabled);
    const inputs = group.querySelectorAll('input');
    inputs.forEach(input => input.disabled = disabled);
    if (addBtn) {
        addBtn.disabled = disabled;
        addBtn.classList.toggle('btn-secondary', disabled);
        addBtn.classList.toggle('active', !disabled);
    }
    updateFirstActionAddon();
}

/**
 * Met à jour le texte de l'addon du premier bloc d'action en fonction de l'état du groupe de rôles.
 */
function updateFirstActionAddon() {
    ['starting', 'tree'].forEach(prefix => {
        const group = document.getElementById(`${prefix}_roleGroup`);
        const addon = document.getElementById(`${prefix}_actionAddon_1`);
        if (addon) {
            // Only for starting prompt, tree of thoughts has fixed persona text
            if (prefix === 'starting') {
                addon.textContent = group.classList.contains('disabled') ? 'I want you to' : 'to';
            }
        }
    });
}

/**
 * Récupère les valeurs des personas pour une section donnée.
 * @param {string} prefix - Le préfixe de la section.
 * @returns {Array<Object>} Un tableau d'objets { persona: string, article: string }.
 */
function getRoleValues(prefix) {
    const group = document.getElementById(`${prefix}_roleGroup`);
    if (group.classList.contains('disabled')) return [];
    if (prefix === 'tree') {
        const personaInput = document.getElementById('tree_role_1');
        return personaInput.value.trim() ? [{ persona: personaInput.value.trim(), article: '' }] : [];
    }
    return Array.from(group.querySelectorAll('input')).filter(i => i.value.trim()).map(input => {
        const dropdown = input.parentElement.querySelector('select');
        return { persona: input.value.trim(), article: dropdown?.value || 'Act as a' };
    });
}

/**
 * Récupère les blocs d'action pour une section donnée.
 * @param {string} prefix - Le préfixe de la section.
 * @returns {Array<Object>} Un tableau d'objets représentant les blocs d'action.
 */
function getActionBlocks(prefix) {
    const blocks = [];
    // Use the actual number of action blocks present, not just the counter
    const actionBlockElements = document.querySelectorAll(`#${prefix}_actionsContainer .action-block`);
    actionBlockElements.forEach(blockElement => {
        const blockId = blockElement.id.split('_').pop();
        const get = id => document.getElementById(`${prefix}_${id}_${blockId}_1`);
        const extract = id => get(id)?.value.trim() || '';
        blocks.push({
            action: extract('action'),
            subject: extract('subject'),
            receiver: extract('receiver'),
            context: extract('context'),
            subjectArticle: blockElement.querySelector('.sub-field-group:nth-child(2) select')?.value || 'a',
            receiverArticle: blockElement.querySelector('.sub-field-group:nth-child(3) select')?.value || 'for',
            contextArticle: blockElement.querySelector('.sub-field-group:nth-child(4) select')?.value || 'that'
        });
    });
    return blocks;
}

/**
 * Récupère les contraintes pour une section donnée.
 * @param {string} prefix - Le préfixe de la section.
 * @returns {Array<string>} Un tableau de chaînes de caractères représentant les contraintes.
 */
function getConstraints(prefix) {
    return Array.from(document.querySelectorAll(`#${prefix}_constraintsContainer input`)).filter(i => i.value.trim()).map(i => i.value.trim());
}

/**
 * Récupère les exemples pour une section donnée.
 * @param {string} prefix - Le préfixe de la section.
 * @returns {Array<string>} Un tableau de chaînes de caractères représentant les exemples.
 */
function getExamples(prefix) {
    return [1, 2].map(i => document.getElementById(`${prefix}_example_${i}`)).filter(el => el?.value.trim()).map(el => el.value.trim());
}

/**
 * Ajuste dynamiquement la hauteur d'un textarea.
 * @param {HTMLTextAreaElement} textarea - L'élément textarea.
 */
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Copie le texte d'un élément dans le presse-papiers et change le texte du bouton momentanément.
 * @param {string} id - L'ID de l'élément textarea dont le contenu doit être copié.
 * @param {Event} event - L'événement du clic, utilisé pour accéder au bouton cliqué.
 */
function copyPrompt(id, event) {
    const el = document.getElementById(id);
    if (!el) {
        console.error('Élément avec ID ' + id + ' non trouvé.');
        return;
    }

    // Tente de focaliser et de sélectionner le texte
    el.focus(); // Tente de focaliser l'élément en premier
    el.select();
    el.setSelectionRange(0, 99999); // Pour les appareils mobiles, sélectionne tout le texte

    let success = false;
    try {
        success = document.execCommand('copy'); // Exécute la commande de copie
    } catch (err) {
        console.error('Échec de la copie du texte avec execCommand:', err);
    }

    const button = event.currentTarget;
    const originalText = button.textContent;

    if (success) {
        button.textContent = 'Copié !'; // Change le texte du bouton
        setTimeout(() => {
            button.textContent = originalText; // Rétablit le texte original après 1.5s
        }, 1500);
    } else {
        // Indication d'échec si la copie a échoué
        console.warn('La commande de copie a échoué.');
        button.textContent = 'Échec copie'; // Indique l'échec
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateFirstActionAddon();

    // Initialize dropdowns for starting prompt
    const startingFirstPersonaGroup = document.querySelector(`#starting_roleGroup .input-group`);
    if (startingFirstPersonaGroup && !startingFirstPersonaGroup.querySelector('select')) {
        const label = startingFirstPersonaGroup.querySelector('span');
        if (label) label.outerHTML = createDropdown('persona', 1);
    }

    const startingFirstBlock = document.getElementById(`starting_actionBlock_1`);
    if (startingFirstBlock) {
        ['subject', 'receiver', 'context'].forEach((type, index) => {
            const group = startingFirstBlock.querySelectorAll('.sub-field-group')[index + 1];
            if (group && !group.querySelector('select')) {
                const label = group.querySelector('span');
                if (label) label.outerHTML = createDropdown(type, 1);
            }
        });
    }

    // Ensure initial state for tree of thoughts persona (no dropdown)
    const treeRoleInput = document.getElementById('tree_role_1');
    if (treeRoleInput) {
        const treeRoleAddon = document.getElementById('tree_roleAddon');
        if (treeRoleAddon) {
            treeRoleAddon.textContent = 'Expert'; // Ensure it's just "Expert"
        }
    }

    // TREE OF THOUGHTS INITIAL ACTION BLOCK DROPDOWNS
    const treeFirstBlock = document.getElementById(`tree_actionBlock_1`);
    if (treeFirstBlock) {
        ['subject', 'receiver', 'context'].forEach((type, index) => {
            // L'index + 1 est utilisé car le premier sub-field-group est pour 'action'
            const group = treeFirstBlock.querySelectorAll('.sub-field-group')[index + 1];
            if (group && !group.querySelector('select')) {
                const label = group.querySelector('span');
                if (label) label.outerHTML = createDropdown(type, 1);
            }
        });
    }
});

/**
 * Vérifie si un bloc d'action est vide.
 * @param {Object} block - L'objet représentant le bloc d'action.
 * @returns {boolean} Vrai si le bloc est vide, faux sinon.
 */
function isBlockEmpty(block) {
    return !block.action && !block.subject && !block.receiver && !block.context;
}

/**
 * Génère le prompt pour la section "Starting Prompt".
 */
document.getElementById('startingPromptForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const roles = getRoleValues('starting');
    const actions = getActionBlocks('starting').filter(block => !isBlockEmpty(block));
    const constraints = getConstraints('starting');
    const examples = getExamples('starting');

    if (roles.length === 0 && actions.length === 0 && constraints.length === 0 && examples.length === 0) {
        document.getElementById('starting_result').value = 'Please provide at least one persona, task, constraint, or example.';
        adjustTextareaHeight(document.getElementById('starting_result'));
        return;
    }

    let prompt = '';
    let hasIAm = false;

    if (roles.length) {
        const first = roles[0];
        hasIAm = first.article === 'I am a';
        prompt += hasIAm ? `I am a ${first.persona}` : `${first.article} ${first.persona}`;
        for (let i = 1; i < roles.length; i++) {
            prompt += ` and ${roles[i].persona}`;
        }
        prompt += hasIAm ? '. ' : ' '; // Added space for consistency
    }

    if (actions.length) {
        prompt += (roles.length === 0 || hasIAm) ? 'I want you ' : '';
        if (actions.length === 1) {
            const a = actions[0];
            prompt += `to ${a.action}`;
            if (a.subject) prompt += ` ${a.subjectArticle} ${a.subject}`;
            if (a.receiver) prompt += ` ${a.receiverArticle} ${a.receiver}`;
            if (a.context) prompt += ` ${a.contextArticle} ${a.context}`;
            prompt += '.';
        } else {
            prompt += 'to:\n';
            actions.forEach((a, i) => {
                prompt += `${i + 1}. ${a.action}`;
                if (a.subject) prompt += ` ${a.subjectArticle} ${a.subject}`;
                if (a.receiver) prompt += ` ${a.receiverArticle} ${a.receiver}`;
                if (a.context) prompt += ` ${a.contextArticle} ${a.context}`;
                prompt += ';\n';
            });
        }
        prompt += '\n'; // Adjusted for single newline
    }

    if (constraints.length) {
        prompt += `Here are your constraints: ${constraints.join(', ')}.\n\n`;
    }

    if (examples.length) {
        prompt += `See the following example${examples.length > 1 ? 's' : ''}:\n`;
        examples.forEach((ex, i) => {
            prompt += examples.length > 1 ? `Example ${i + 1}:\n${ex}\n\n` : `${ex}\n\n`;
        });
    }

    prompt += 'Make sure your response is clear, detailed, and helpful.';
    const result = document.getElementById('starting_result');
    result.value = prompt;
    adjustTextareaHeight(result);
});

/**
 * Génère le prompt pour la section "Tree of Thoughts Prompting".
 */
document.getElementById('treePromptForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const persona = document.getElementById('tree_role_1').value.trim();
    const actions = getActionBlocks('tree').filter(block => !isBlockEmpty(block));
    const constraints = getConstraints('tree');
    const examples = getExamples('tree');

    if (!persona) {
        document.getElementById('tree_result').value = 'Please define an expert persona.';
        adjustTextareaHeight(document.getElementById('tree_result'));
        return;
    }

    if (actions.length === 0 && constraints.length === 0 && examples.length === 0) {
        document.getElementById('tree_result').value = 'Please provide at least one task, constraint, or example for the inner prompt.';
        adjustTextareaHeight(document.getElementById('tree_result'));
        return;
    }

    // Generate the inner prompt (like the starting prompt)
    let innerPrompt = '';

    if (actions.length) {
        innerPrompt += 'I want you ';
        if (actions.length === 1) {
            const a = actions[0];
            innerPrompt += `to ${a.action}`;
            if (a.subject) innerPrompt += ` ${a.subjectArticle} ${a.subject}`;
            if (a.receiver) innerPrompt += ` ${a.receiverArticle} ${a.receiver}`;
            if (a.context) innerPrompt += ` ${a.contextArticle} ${a.context}`;
            innerPrompt += '.';
        } else {
            innerPrompt += 'to:\n';
            actions.forEach((a, i) => {
                innerPrompt += `${i + 1}. ${a.action}`;
                if (a.subject) innerPrompt += ` ${a.subjectArticle} ${a.subject}`;
                if (a.receiver) innerPrompt += ` ${a.receiverArticle} ${a.receiver}`;
                if (a.context) innerPrompt += ` ${a.contextArticle} ${a.context}`;
                innerPrompt += ';\n';
            });
        }
        innerPrompt += '\n';
    }

    if (constraints.length) {
        innerPrompt += `Here are your constraints: ${constraints.join(', ')}.\n\n`;
    }

    if (examples.length) {
        innerPrompt += `See the following example${examples.length > 1 ? 's' : ''}:\n`;
        examples.forEach((ex, i) => {
            innerPrompt += examples.length > 1 ? `Example ${i + 1}:\n${ex}\n\n` : `${ex}\n\n`;
        });
    }

    innerPrompt += 'Proceed.';

    // Construct the final Tree of Thoughts prompt
    let fullPrompt = `Imagine three different expert ${persona}s are pitching their ideas to me. All experts will write down one step of their thinking, then share it with the group. Then all experts will go on to the next step, etc. If any experts realize they are wrong at any point, then they leave. My question to them is : ${innerPrompt}`;

    const result = document.getElementById('tree_result');
    result.value = fullPrompt;
    adjustTextareaHeight(result);
});
