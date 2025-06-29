document.addEventListener('DOMContentLoaded', () => {
    const addDependencyBtn = document.getElementById('add-dependency');
    const generateYamlBtn = document.getElementById('generate-yaml');
    const downloadYamlBtn = document.getElementById('download-yaml');
    const dependencyList = document.getElementById('dependency-items');
    const yamlDisplay = document.getElementById('yaml-display');
    const temporalDependencySelect = document.getElementById('temporal-dependency');
    const existentialDependencySelect = document.getElementById('existential-dependency');
    const temporalDirectionSelect = document.getElementById('temporal-direction');
    const existentialDirectionSelect = document.getElementById('existential-direction');


    let dependencies = [];

    const bothDirectionTypes = ['equivalence', 'negated equivalence', 'nand', 'or', 'independence', 'none'];

    temporalDependencySelect.addEventListener('change', (e) => {
        if (bothDirectionTypes.includes(e.target.value)) {
            temporalDirectionSelect.value = 'both';
        } else {
            temporalDirectionSelect.value = 'forward';
        }
    });

    existentialDependencySelect.addEventListener('change', (e) => {
        if (bothDirectionTypes.includes(e.target.value)) {
            existentialDirectionSelect.value = 'both';
        } else {
            existentialDirectionSelect.value = 'forward';
        }
    });

    addDependencyBtn.addEventListener('click', () => {
        const from = document.getElementById('from-activity').value.trim();
        const to = document.getElementById('to-activity').value.trim();
        let temporal = temporalDependencySelect.value;
        let temporal_direction = temporalDirectionSelect.value;
        let existential = existentialDependencySelect.value;
        const existential_direction = existentialDirectionSelect.value;

        if (from && to) {
            const existingDependency = dependencies.find(d => d.from === from && d.to === to);
            if (existingDependency) {
                alert(`A dependency between "${from}" and "${to}" already exists.`);
                return;
            }
            const dependency = { from, to, temporal, temporal_direction, existential, existential_direction };
            dependencies.push(dependency);
            renderDependencies();
            clearDependencyForm();
        } else {
            alert('"From" and "To" activities are required.');
        }
    });

    generateYamlBtn.addEventListener('click', () => {
        const activitySet = new Set();
        dependencies.forEach(dep => {
            activitySet.add(dep.from);
            activitySet.add(dep.to);
        });
        const activities = Array.from(activitySet).sort();

        if (dependencies.length === 0) {
            alert('Please add at least one dependency.');
            return;
        }

        const yamlObject = buildYamlObject(activities, dependencies);

        try {
            const yamlString = jsyaml.dump(yamlObject, {
                indent: 2,
                sortKeys: false,
                noRefs: true,
                styles: {
                    '!!seq': 'block'
                }
            }).replace(/activities: \[([^\]]+)\]/, (match, p1) => `activities: [${p1.replace(/,/g, ', ')}]`);

            yamlDisplay.textContent = yamlString;
            downloadYamlBtn.disabled = false;
        } catch (e) {
            console.error(e);
            yamlDisplay.textContent = 'Error generating YAML.';
            downloadYamlBtn.disabled = true;
        }
    });

    downloadYamlBtn.addEventListener('click', () => {
        const yamlContent = yamlDisplay.textContent;
        if (yamlContent) {
            const blob = new Blob([yamlContent], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'matrix.yaml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    function buildYamlObject(activities, dependencies) {
        const temporalSymbols = {
            'direct': '≺_d',
            'eventual': '≺_e',
            'independence': '-'
        };

        const existentialSymbols = {
            'implication': '⇒',
            'equivalence': '⇔',
            'negated equivalence': '<=/=>',
            'nand': '|',
            'or': 'v',
            'independence': '-'
        };

        const depsForYaml = dependencies.map(dep => {
            const dependencyEntry = {
                from: dep.from,
                to: dep.to
            };

            if (dep.temporal && dep.temporal !== 'none') {
                dependencyEntry.temporal = {
                    type: dep.temporal,
                    symbol: temporalSymbols[dep.temporal] || '',
                    direction: dep.temporal_direction
                };
            }

            if (dep.existential && dep.existential !== 'none') {
                dependencyEntry.existential = {
                    type: dep.existential,
                    symbol: existentialSymbols[dep.existential] || '',
                    direction: dep.existential_direction
                };
            }

            return dependencyEntry;
        });

        return {
            metadata: {
                format_version: "1.0",
                description: "Automatically generated adjacency matrix",
                activities: activities
            },
            dependencies: depsForYaml
        };
    }

    function renderDependencies() {
        dependencyList.innerHTML = '';
        dependencies.forEach((dep, index) => {
            const item = document.createElement('li');
            item.innerHTML = `
                <span>
                    <strong>From:</strong> ${dep.from} 
                    <strong>To:</strong> ${dep.to} 
                    <strong>Temporal:</strong> ${dep.temporal} (${dep.temporal_direction})
                    <strong>Existential:</strong> ${dep.existential} (${dep.existential_direction})
                </span>
                <button class="delete-dependency" data-index="${index}">Delete</button>
            `;
            dependencyList.appendChild(item);
        });

        document.querySelectorAll('.delete-dependency').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                dependencies.splice(index, 1);
                renderDependencies();
            });
        });
    }

    function clearDependencyForm() {
        document.getElementById('from-activity').value = '';
        document.getElementById('to-activity').value = '';
        document.getElementById('temporal-dependency').value = 'none';
        document.getElementById('existential-dependency').value = 'independence';
        document.getElementById('temporal-direction').value = 'forward';
        document.getElementById('existential-direction').value = 'both';
    }
});
