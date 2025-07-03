let fieldCounters = {
    role: 1,
    constraint: 1
};

let actionBlockCounter = 1;

// Options pour les menus déroulants
const articleOptions = {
    persona: ['Act as a', 'I am a'],
    subject: ['a', 'an', 'the', 'this', 'a few', 'several'],
    receiver: ['for', 'to', 'aimed at'],
    context: ['that', 'which', 'who', 'with', 'having']
};

// Fonction pour créer un menu déroulant
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

// Fonction pour mettre à jour un article
function updateArticle(type, blockId, newValue) {
    // Cette fonction est appelée quand l'utilisateur change la sélection
    // Le DOM est automatiquement mis à jour par le select
}

// Fonction pour ajouter un champ role
function addField(fieldType) {
    if (fieldType === 'role') {
        fieldCounters.role++;
        const counter = fieldCounters.role;
        const group = document.getElementById('roleGroup');

        const newField = document.createElement('div');
        newField.className = 'row';
        newField.innerHTML = `
            <div class="col">
                <div class="input-group field m-2">
                    ${createDropdown('persona', counter, 'and a')}
                    <input type="text" class="form-control" id="role_${counter}" placeholder="Define a persona...">
                    <button type="button" class="btn btn-outline-secondary btn-delete" onclick="deleteField('role', ${counter})">✕</button>
                </div>
            </div>
        `;

        group.appendChild(newField);
    } else if (fieldType === 'constraint') {
        fieldCounters.constraint++;
        const counter = fieldCounters.constraint;
        const constraintGroup = document.querySelector('.sub-field-group:has(.sub-field-title)');

        const newField = document.createElement('div');
        newField.className = 'input-group field';
        newField.innerHTML = `
            <span class="input-group-text">I want</span>
            <input type="text" class="form-control" id="constraint_${counter}" placeholder="output in JSON format, use real-world examples...">
            <button type="button" class="btn btn-outline-secondary btn-delete" onclick="deleteField('constraint', ${counter})">✕</button>
        `;

        constraintGroup.appendChild(newField);
    }
}

// Fonction pour ajouter un bloc d'action complet
function addActionBlock() {
    actionBlockCounter++;
    const actionsContainer = document.getElementById('actionsContainer');

    const newActionBlock = document.createElement('div');
    newActionBlock.className = 'action-block';
    newActionBlock.id = `actionBlock_${actionBlockCounter}`;
    newActionBlock.innerHTML = `
        <div class="action-block-header mb-2">
            <span class="action-block-title">Task ${actionBlockCounter}</span>
            <button type="button" class="btn btn-outline-secondary btn-delete ms-2" onclick="deleteActionBlock(${actionBlockCounter})">✕ Delete block</button>
        </div>
        <div class="container">
            <div class="sub-field-group mb-2">
                <div class="input-group field">
                    <span class="input-group-text" id="actionAddon_${actionBlockCounter}">to</span>
                    <input type="text" class="form-control" id="action_${actionBlockCounter}_1"
                        placeholder="translate, compare, brainstorm, sketch..."
                        aria-describedby="actionAddon_${actionBlockCounter}" />
                </div>
            </div>

            <div class="sub-field-group mb-2">
                <div class="input-group field">
                    ${createDropdown('subject', actionBlockCounter)}
                    <input type="text" class="form-control" id="subject_${actionBlockCounter}_1"
                        placeholder="promotional email, business pitch, test case..." />
                </div>
            </div>

            <div class="sub-field-group mb-2">
                <div class="input-group field">
                    ${createDropdown('receiver', actionBlockCounter)}
                    <input type="text" class="form-control" id="receiver_${actionBlockCounter}_1"
                        placeholder="an employer, a local business, an e-commerce..." />
                </div>
            </div>

            <div class="sub-field-group mb-2">
                <div class="input-group field">
                    ${createDropdown('context', actionBlockCounter)}
                    <input type="text" class="form-control" id="context_${actionBlockCounter}_1"
                        placeholder="travels frequently, avoids social media..." />
                </div>
            </div>
        </div>
    `;

    actionsContainer.appendChild(newActionBlock);
    updateDeleteButtonsState();
}

// Fonction pour désactiver tous les boutons "✕ Delete block" qui ne sont pas liés au dernier bloc ajouté
function updateDeleteButtonsState() {
    const blocks = document.querySelectorAll('.action-block');
    let maxVisibleId = 0;

    blocks.forEach(block => {
        const id = parseInt(block.id.split('_')[1], 10);
        if (id > maxVisibleId) {
            maxVisibleId = id;
        }
    });

    const deleteButtons = document.querySelectorAll('.action-block .btn-delete');
    deleteButtons.forEach(button => {
        const buttonText = button.getAttribute('onclick');
        if (buttonText && buttonText.includes('deleteActionBlock')) {
            const buttonId = parseInt(buttonText.match(/deleteActionBlock\((\d+)\)/)[1], 10);
            button.disabled = buttonId !== maxVisibleId;
        }
    });
}

// Fonction pour supprimer un champ
function deleteField(fieldType, counter) {
    const fieldElement = document.getElementById(`${fieldType}_${counter}`);
    if (fieldElement) {
        fieldElement.closest('.row, .input-group').remove();
    }
}

// Fonction pour supprimer un bloc d'action complet
function deleteActionBlock(blockId) {
    const blockElement = document.getElementById(`actionBlock_${blockId}`);
    if (blockElement) {
        blockElement.remove();
        actionBlockCounter--;
        updateDeleteButtonsState();
    }
}

// Fonction pour activer/désactiver un groupe
function toggleGroup(groupId) {
    const group = document.getElementById(groupId);
    const toggleBtn = group.querySelector('.toggle');
    const addBtn = group.querySelector('.addBtn');

    if (group.classList.contains('disabled')) {
        group.classList.remove('disabled');
        toggleBtn.textContent = '✓ Active';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('active');
        const inputs = group.querySelectorAll('input');
        inputs.forEach(input => input.disabled = false);
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.classList.remove('btn-secondary');
            addBtn.classList.add('active');
        }

        // Mettre à jour le texte du premier actionAddon si les personas sont réactivés
        updateFirstActionAddon();

    } else {
        group.classList.add('disabled');
        toggleBtn.textContent = '✗ Disabled';
        toggleBtn.classList.remove('active');
        toggleBtn.classList.add('btn-secondary');
        const inputs = group.querySelectorAll('input');
        inputs.forEach(input => input.disabled = true);
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.classList.remove('active');
            addBtn.classList.add('btn-secondary');
        }

        // Mettre à jour le texte du premier actionAddon si les personas sont désactivés
        updateFirstActionAddon();
    }
}

// Fonction pour mettre à jour le premier actionAddon selon l'état des personas
function updateFirstActionAddon() {
    const roleGroup = document.getElementById('roleGroup');
    const firstActionAddon = document.getElementById('actionAddon_1');

    if (firstActionAddon) {
        if (roleGroup.classList.contains('disabled')) {
            firstActionAddon.textContent = 'I want you to';
        } else {
            firstActionAddon.textContent = 'to';
        }
    }
}

// Fonction pour mettre à jour les dropdowns du premier bloc d'action et du premier persona
function updateFirstActionBlockDropdowns() {
    // Mettre à jour le premier persona avec un dropdown
    const firstPersonaGroup = document.querySelector('#roleGroup .input-group');
    if (firstPersonaGroup && !firstPersonaGroup.querySelector('.article-dropdown')) {
        const personaAddon = firstPersonaGroup.querySelector('#roleAddon');
        if (personaAddon) {
            personaAddon.outerHTML = createDropdown('persona', 1, 'Act as a');
        }
    }

    const firstBlock = document.getElementById('actionBlock_1');
    if (firstBlock) {
        // Mettre à jour le dropdown subject
        const subjectGroup = firstBlock.querySelector('.sub-field-group:nth-child(2) .input-group');
        if (subjectGroup && !subjectGroup.querySelector('.article-dropdown')) {
            const subjectAddon = subjectGroup.querySelector('#subjectAddon_1');
            if (subjectAddon) {
                subjectAddon.outerHTML = createDropdown('subject', 1);
            }
        }

        // Mettre à jour le dropdown receiver
        const receiverGroup = firstBlock.querySelector('.sub-field-group:nth-child(3) .input-group');
        if (receiverGroup && !receiverGroup.querySelector('.article-dropdown')) {
            const receiverAddon = receiverGroup.querySelector('#receiverAddon_1');
            if (receiverAddon) {
                receiverAddon.outerHTML = createDropdown('receiver', 1);
            }
        }

        // Mettre à jour le dropdown context
        const contextGroup = firstBlock.querySelector('.sub-field-group:nth-child(4) .input-group');
        if (contextGroup && !contextGroup.querySelector('.article-dropdown')) {
            const contextAddon = contextGroup.querySelector('#contextAddon_1');
            if (contextAddon) {
                contextAddon.outerHTML = createDropdown('context', 1);
            }
        }
    }
}

// Fonction pour collecter toutes les valeurs des rôles avec leurs articles
function getRoleValues() {
    const roleGroup = document.getElementById('roleGroup');
    if (roleGroup.classList.contains('disabled')) {
        return [];
    }

    const values = [];
    for (let i = 1; i <= fieldCounters.role; i++) {
        const input = document.getElementById(`role_${i}`);
        if (input && !input.disabled && input.value.trim()) {
            // Trouver le dropdown correspondant
            const dropdown = input.parentElement.querySelector('.article-dropdown');
            const article = dropdown ? dropdown.value : 'Act as a';

            values.push({
                persona: input.value.trim(),
                article: article
            });
        }
    }
    return values;
}

// Fonction pour collecter toutes les actions organisées par bloc
function getActionBlocks() {
    const actionBlocks = [];

    for (let blockId = 1; blockId <= actionBlockCounter; blockId++) {
        const block = document.getElementById(`actionBlock_${blockId}`);
        if (!block) continue;

        const action = document.getElementById(`action_${blockId}_1`);
        const subject = document.getElementById(`subject_${blockId}_1`);
        const receiver = document.getElementById(`receiver_${blockId}_1`);
        const context = document.getElementById(`context_${blockId}_1`);

        // Récupérer les valeurs des dropdowns
        const subjectDropdown = block.querySelector('.sub-field-group:nth-child(2) .article-dropdown');
        const receiverDropdown = block.querySelector('.sub-field-group:nth-child(3) .article-dropdown');
        const contextDropdown = block.querySelector('.sub-field-group:nth-child(4) .article-dropdown');

        const blockData = {
            action: action ? action.value.trim() : '',
            subject: subject ? subject.value.trim() : '',
            receiver: receiver ? receiver.value.trim() : '',
            context: context ? context.value.trim() : '',
            subjectArticle: subjectDropdown ? subjectDropdown.value : 'a',
            receiverArticle: receiverDropdown ? receiverDropdown.value : 'for',
            contextArticle: contextDropdown ? contextDropdown.value : 'that'
        };

        if (blockData.action || blockData.subject || blockData.receiver || blockData.context) {
            actionBlocks.push(blockData);
        }
    }

    return actionBlocks;
}

// Fonction pour collecter les contraintes
function getConstraints() {
    const constraints = [];
    for (let i = 1; i <= fieldCounters.constraint; i++) {
        const input = document.getElementById(`constraint_${i}`);
        if (input && input.value.trim()) {
            constraints.push(input.value.trim());
        }
    }
    return constraints;
}

// Fonction pour collecter les exemples
function getExamples() {
    const examples = [];
    const example1 = document.getElementById('example_1');
    const example2 = document.getElementById('example_2');

    if (example1 && example1.value.trim()) {
        examples.push(example1.value.trim());
    }
    if (example2 && example2.value.trim()) {
        examples.push(example2.value.trim());
    }

    return examples;
}

// Génération du prompt final
document.getElementById('simplePromptForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const roles = getRoleValues();
    const actionBlocks = getActionBlocks();
    const constraints = getConstraints();
    const examples = getExamples();

    let promptTemplate = '';

    // Rôles
    let hasIAmPersona = false;
    if (roles.length > 0) {
        if (roles.length === 1) {
            const role = roles[0];
            if (role.article === 'I am a') {
                promptTemplate += `I am a ${role.persona}. `;
                hasIAmPersona = true;
            } else {
                promptTemplate += `Act as a ${role.persona} `;
            }
        } else {
            // Vérifier si le premier est "I am a"
            const firstRole = roles[0];
            if (firstRole.article === 'I am a') {
                promptTemplate += `I am a ${firstRole.persona}`;
                hasIAmPersona = true;
                // Ajouter les autres rôles
                for (let i = 1; i < roles.length; i++) {
                    promptTemplate += ` and ${roles[i].persona}`;
                }
                promptTemplate += '. ';
            } else {
                promptTemplate += `Act as a ${roles[0].persona}`;
                for (let i = 1; i < roles.length; i++) {
                    promptTemplate += ` and ${roles[i].persona}`;
                }
                promptTemplate += ' ';
            }
        }
    }

    // Actions
    if (actionBlocks.length > 0) {
        if (roles.length === 0) {
            promptTemplate += 'I want you ';
        } else if (hasIAmPersona) {
            promptTemplate += 'I want you ';
        }

        if (actionBlocks.length === 1) {
            // Une seule tâche - pas de liste
            const block = actionBlocks[0];
            promptTemplate += 'to ';

            if (block.action) {
                promptTemplate += block.action;
            } else {
                promptTemplate += '[ACTION]';
            }

            if (block.subject) {
                promptTemplate += ` ${block.subjectArticle} ${block.subject}`;
            }

            if (block.receiver) {
                promptTemplate += ` ${block.receiverArticle} ${block.receiver}`;
            }

            if (block.context) {
                promptTemplate += ` ${block.contextArticle} ${block.context}`;
            }

            promptTemplate += '.\n\n';
        } else {
            // Plusieurs tâches - liste structurée
            promptTemplate += 'to:\n';

            actionBlocks.forEach((block, index) => {
                promptTemplate += `${index + 1}. `;

                if (block.action) {
                    promptTemplate += block.action;
                } else {
                    promptTemplate += '[ACTION]';
                }

                if (block.subject) {
                    promptTemplate += ` ${block.subjectArticle} ${block.subject}`;
                }

                if (block.receiver) {
                    promptTemplate += ` ${block.receiverArticle} ${block.receiver}`;
                }

                if (block.context) {
                    promptTemplate += ` ${block.contextArticle} ${block.context}`;
                }

                promptTemplate += ';\n';
            });

            promptTemplate += '\n';
        }
    }

    // Contraintes
    if (constraints.length > 0) {
        promptTemplate += 'Here are your constraints: ';
        promptTemplate += constraints.join(', ');
        promptTemplate += '.\n\n';
    }

    // Exemples
    if (examples.length > 0) {
        if (examples.length === 1) {
            promptTemplate += 'See the following example:\n';
            promptTemplate += examples[0] + '\n\n';
        } else {
            promptTemplate += 'See the following examples:\n';
            examples.forEach((example, index) => {
                promptTemplate += `Example ${index + 1}:\n${example}\n\n`;
            });
        }
    }

    promptTemplate += 'Make sure your response is clear, detailed, and helpful.';

    const resultTextarea = document.getElementById('result');
    resultTextarea.value = promptTemplate || 'Please fill in at least one active field.';
    adjustTextareaHeight(resultTextarea);
});

//Ajuster la hauteur du textarea du prompt
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Copier le contenu du prompt
function copyPrompt(event) {
    const generatedPrompt = document.getElementById('result').value;
    // Copy the text inside the text field
    navigator.clipboard.writeText(generatedPrompt);

    event.preventDefault();
}

// Initialiser l'état du premier actionAddon au chargement
document.addEventListener('DOMContentLoaded', function () {
    updateFirstActionAddon();
    updateFirstActionBlockDropdowns();
});