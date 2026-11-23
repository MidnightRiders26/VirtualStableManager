document.addEventListener("DOMContentLoaded", () => {
    // STORAGE
    const STORAGE_KEY = "vsm-horses";

    function loadHorses() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Could not load horse records:", error);
            return [];
        }
    }

    let horses = loadHorses();
    let activeRegistry = "active";
    let selectedHorseId = null;
    let editingHorseId = null;

    function saveHorses() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(horses));
    }

    // ELEMENT REFERENCES
    const pageTitle = document.getElementById("page-title");
    const breadcrumb = document.getElementById("breadcrumb-current");
    const horseList = document.getElementById("horse-list");
    const searchInput = document.getElementById("horse-search");
    const breedFilter = document.getElementById("breed-filter");
    const sortSelect = document.getElementById("sort-horses");
    const addHorseForm = document.getElementById("add-horse-form");
    const addHorseMessage = document.getElementById("add-horse-message");
    const editHorseButton = document.getElementById("edit-horse-button");

    // HEALTH FIELD NAMES
    const healthFields = {
        fertility: "fertility",
        colicResistance: "colicResistance",
        hoofQuality: "hoofQuality",
        backProblems: "backProblems",
        respiratoryDisease: "respiratoryDisease",
        lamenessResistance: "lamenessResistance"
    };

    // INDIVIDUAL GP AND CONFORMATION FIELD NAMES
    const gpFields = {
        acceleration: "acceleration",
        bascule: "bascule",
        sprint: "sprint",
        surefootedness: "surefootedness",
        agility: "agility",
        pullingPower: "pullingPower",
        stamina: "stamina",
        balance: "balance",
        speed: "speed",
        strength: "strength"
    };

    const conformationFields = {
        walk: "walk",
        trot: "trot",
        canter: "canter",
        gallop: "gallop",
        posture: "posture",
        head: "head",
        neck: "neck",
        back: "back",
        shoulders: "shoulders",
        forelegs: "forelegs",
        hindquarters: "hindquarters",
        socks: "socks"
    };

    // CURRENT DATE
    const dateElement = document.getElementById("current-date");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }

    // PAGE NAVIGATION
    const navButtons = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");

    const pageTitles = {
        dashboard: "Dashboard",
        horses: "Horse Registry",
        "add-horse": "Add Horse",
        profile: "Horse Profile",
        pedigree: "Pedigree & Genetics",
        breeding: "Breeding Management",
        offspring: "Offspring Records",
        performance: "Performance",
        market: "Market & Pricing",
        statistics: "Statistics",
        settings: "Settings"
    };

    function openPage(pageName) {
        const targetPage = document.getElementById(`${pageName}-page`);

        if (!targetPage) {
            console.error(`Page not found: ${pageName}`);
            return;
        }

        pages.forEach(page => page.classList.remove("active"));
        targetPage.classList.add("active");

        navButtons.forEach(button => {
            const activePage =
                pageName === "add-horse" || pageName === "profile"
                    ? "horses"
                    : pageName;

            button.classList.toggle(
                "active",
                button.dataset.page === activePage
            );
        });

        const title = pageTitles[pageName] || "Virtual Stable Manager";

        if (pageTitle) pageTitle.textContent = title;
        if (breadcrumb) breadcrumb.textContent = title;

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            openPage(button.dataset.page);
        });
    });

    document.querySelectorAll("[data-navigate]").forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.navigate === "add-horse") {
                startAddingHorse();
            } else {
                openPage(button.dataset.navigate);
            }
        });
    });

    // HORSE AGE
    function calculateAge(dateOfBirth) {
        if (!dateOfBirth) return "Not entered";

        const birth = new Date(`${dateOfBirth}T00:00:00`);
        const today = new Date();

        if (Number.isNaN(birth.getTime()) || birth > today) {
            return "Not entered";
        }

        let age = today.getFullYear() - birth.getFullYear();

        if (
            today.getMonth() < birth.getMonth() ||
            (
                today.getMonth() === birth.getMonth() &&
                today.getDate() < birth.getDate()
            )
        ) {
            age--;
        }

        return age === 1 ? "1 year" : `${age} years`;
    }

    function calculateNumericAge(horse) {
        const age = calculateAge(horse.dob);
        const number = parseInt(age, 10);
        return Number.isNaN(number) ? -1 : number;
    }

    function displayValue(value) {
        return value !== undefined && value !== null && value !== ""
            ? value
            : "Not entered";
    }

    // DASHBOARD COUNTS
    function updateCounts() {
        const total = horses.length;

        const active = horses.filter(
            horse => (horse.status || "active") === "active"
        ).length;

        const sold = horses.filter(horse => horse.status === "sold").length;
        const retired = horses.filter(horse => horse.status === "retired").length;
        const deceased = horses.filter(horse => horse.status === "deceased").length;

        const totalElement = document.getElementById("dashboard-total-horses");
        const activeElement = document.getElementById("dashboard-active-horses");
        const registryElement = document.getElementById("registry-active-count");

        if (totalElement) totalElement.textContent = total;
        if (activeElement) activeElement.textContent = active;
        if (registryElement) registryElement.textContent = active;

        const registryStats = document.querySelectorAll(".registry-stat strong");

        if (registryStats[0]) registryStats[0].textContent = active;
        if (registryStats[1]) registryStats[1].textContent = sold;
        if (registryStats[2]) registryStats[2].textContent = retired;
        if (registryStats[3]) registryStats[3].textContent = deceased;

        const overview = document.querySelectorAll(".overview-list strong");

        if (overview[0]) overview[0].textContent = sold;
        if (overview[1]) overview[1].textContent = retired;
        if (overview[2]) overview[2].textContent = deceased;

        const foals = horses.filter(
            horse => ["Foal", "Filly", "Colt"].includes(horse.sex)
        ).length;

        const horsesForSale = horses.filter(
            horse => (horse.status || "active") === "active" &&
                horse.listedForSale === true
        ).length;

        const statValues = document.querySelectorAll(".stat-card strong");
        const forSaleElement = document.getElementById("dashboard-for-sale-horses");

        if (statValues[2]) statValues[2].textContent = foals;
        if (forSaleElement) forSaleElement.textContent = horsesForSale;
    }

    // HORSE REGISTRY
    function renderHorses() {
        updateCounts();
        renderMarketOverview();

        if (!horseList) return;

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedBreed = breedFilter
            ? breedFilter.value.toLowerCase()
            : "all";

        const sortBy = sortSelect ? sortSelect.value : "name";

        const filteredHorses = horses.filter(horse => {
            const matchesStatus =
                (horse.status || "active") === activeRegistry;

            const matchesSearch =
                (horse.name || "").toLowerCase().includes(searchTerm) ||
                (horse.breed || "").toLowerCase().includes(searchTerm) ||
                (horse.hrId || "").toLowerCase().includes(searchTerm);

            let matchesBreed = true;

            if (selectedBreed !== "all") {
                const breed = (horse.breed || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                if (selectedBreed === "other") {
                    matchesBreed = ![
                        "appaloosa",
                        "arabian",
                        "quarter-horse",
                        "icelandic"
                    ].includes(breed);
                } else {
                    matchesBreed = breed === selectedBreed;
                }
            }

            return matchesStatus && matchesSearch && matchesBreed;
        });

        filteredHorses.sort((a, b) => {
            if (sortBy === "breed") {
                return (a.breed || "").localeCompare(b.breed || "");
            }

            if (sortBy === "age") {
                return calculateNumericAge(b) - calculateNumericAge(a);
            }

            if (sortBy === "gp") {
                return (Number(b.gp) || 0) - (Number(a.gp) || 0);
            }

            return (a.name || "").localeCompare(b.name || "");
        });

        horseList.innerHTML = "";

        if (filteredHorses.length === 0) {
            horseList.classList.remove("has-horses");

            const emptyState = document.createElement("div");
            emptyState.className = "registry-empty-state";

            const icon = document.createElement("span");
            icon.className = "empty-state-icon";
            icon.textContent = "🐎";

            const heading = document.createElement("h3");
            heading.textContent = "No horses found";

            const message = document.createElement("p");
            message.textContent = "Add a horse or adjust your search and filters.";

            emptyState.append(icon, heading, message);
            horseList.appendChild(emptyState);
            return;
        }

        horseList.classList.add("has-horses");

        filteredHorses.forEach(horse => {
            const card = document.createElement("article");
            card.className = "horse-card";
            card.dataset.horseId = horse.id;

            const image = document.createElement("div");
            image.className = "horse-card-image";

            if (horse.photo) {
                const photo = document.createElement("img");
                photo.src = horse.photo;
                photo.alt = horse.name || "Horse";
                image.appendChild(photo);
            } else {
                image.textContent = "🐎";
            }

            const details = document.createElement("div");
            details.className = "horse-card-details";

            const name = document.createElement("h3");
            name.textContent = horse.name || "Unnamed Horse";

            const breed = document.createElement("p");
            breed.textContent = horse.breed || "Breed not entered";

            const meta = document.createElement("div");
            meta.className = "horse-card-meta";

            const sex = document.createElement("span");
            sex.textContent = horse.sex || "Sex not entered";

            const age = document.createElement("span");
            age.textContent = calculateAge(horse.dob);

            const gp = document.createElement("span");
            gp.textContent = horse.gp !== undefined && horse.gp !== ""
                ? `GP ${horse.gp}`
                : "GP not entered";

            meta.append(sex, age, gp);
            details.append(name, breed, meta);
            card.append(image, details);

            card.addEventListener("click", () => {
                openHorseProfile(horse.id);
            });

            horseList.appendChild(card);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", renderHorses);
    }

    if (breedFilter) {
        breedFilter.addEventListener("change", renderHorses);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", renderHorses);
    }

    document.querySelectorAll("[data-registry]").forEach(button => {
        button.addEventListener("click", () => {
            activeRegistry = button.dataset.registry;

            document.querySelectorAll("[data-registry]").forEach(tab => {
                tab.classList.toggle("active", tab === button);
            });

            renderHorses();
        });
    });

    // FORM HELPERS
    function setFormMessage(message, type = "success") {
        if (!addHorseMessage) return;

        addHorseMessage.textContent = message;
        addHorseMessage.className = `form-message ${type}`;
    }

    function clearFormMessage() {
        if (!addHorseMessage) return;

        addHorseMessage.textContent = "";
        addHorseMessage.className = "form-message";
    }

    function setFieldValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value ?? "";
    }

    function getFieldValue(id) {
        const field = document.getElementById(id);
        return field ? field.value.trim() : "";
    }

    function startAddingHorse() {
        editingHorseId = null;

        if (addHorseForm) {
            addHorseForm.reset();
        }

        clearFormMessage();

        const heading = document.getElementById("add-horse-heading");
        if (heading) heading.textContent = "Add New Horse";

        if (editHorseButton) editHorseButton.textContent = "Save Horse";

        openPage("add-horse");
    }

    function startEditingHorse(horse) {
        if (!horse) return;

        editingHorseId = horse.id;
        clearFormMessage();

        setFieldValue("horse-name", horse.name);
        setFieldValue("horse-hr-id", horse.hrId);
        setFieldValue("horse-breed", horse.breed);
        setFieldValue("horse-sex", horse.sex);
        setFieldValue("horse-dob", horse.dob);
        setFieldValue("horse-gp", horse.gp);
        setFieldValue("horse-coi", horse.coi);
        setFieldValue("horse-sire", horse.sire);
        setFieldValue("horse-dam", horse.dam);
        setFieldValue("horse-photo", horse.photo);
        setFieldValue("horse-notes", horse.notes);

        const heading = document.getElementById("add-horse-heading");
        if (heading) heading.textContent = "Edit Horse";

        if (editHorseButton) editHorseButton.textContent = "Save Changes";

        const health = horse.health || {};
        Object.keys(healthFields).forEach(key => {
            setFieldValue(`health-${key}`, health[key]);
        });

        const gpTraits = horse.gpTraits || {};
        Object.keys(gpFields).forEach(key => {
            setFieldValue(`gp-${key}`, gpTraits[key]);
        });

        const conformationTraits = horse.conformationTraits || {};
        Object.keys(conformationFields).forEach(key => {
            setFieldValue(`confo-${key}`, conformationTraits[key]);
        });

        setFieldValue(
            "horse-conformation-paste",
            formatConformationForPaste(conformationTraits)
        );

        openPage("add-horse");
    }

    // CONFORMATION GRADE NORMALIZATION AND PASTE PARSING
    function normalizeConformationGrade(value) {
        const normalized = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[–—]/g, "-");

        const gradeMap = {
            "very good": "VG",
            "vg": "VG",
            "good plus": "G+",
            "good+": "G+",
            "good +": "G+",
            "g+": "G+",
            "good": "G",
            "g": "G",
            "average": "A",
            "a": "A",
            "below average": "BA",
            "below-average": "BA",
            "ba": "BA",
            "poor": "P",
            "p": "P"
        };

        return gradeMap[normalized] || "";
    }

    function parseConformationPaste(text) {
        const parsed = {};
        if (!text) return parsed;

        const lines = String(text).split(/\r?\n/);

        lines.forEach(line => {
            const match = line.match(
                /^\s*([^:]+?)\s*:\s*(Very\s+Good|Good\s*\+|Good|Average|Below\s+Average|Poor|VG|G\+|G|A|BA|P)\s*$/i
            );

            if (!match) return;

            const label = match[1].trim().toLowerCase();
            const grade = normalizeConformationGrade(match[2]);

            const field = Object.keys(conformationFields).find(key => {
                return key.toLowerCase() === label;
            });

            if (field && grade) {
                parsed[field] = grade;
            }
        });

        return parsed;
    }

    function formatConformationForPaste(traits) {
        const labels = {
            walk: "Walk",
            trot: "Trot",
            canter: "Canter",
            gallop: "Gallop",
            posture: "Posture",
            head: "Head",
            neck: "Neck",
            back: "Back",
            shoulders: "Shoulders",
            forelegs: "Forelegs",
            hindquarters: "Hindquarters",
            socks: "Socks"
        };

        return Object.keys(labels)
            .map(key => {
                const grade = normalizeConformationGrade(traits?.[key]);
                const displayGrade = grade === "G+" ? "Good+" : grade;

                return `${labels[key]}: ${displayGrade || ""}`;
            })
            .join("\n");
    }

    // FORM SUBMISSION
    if (addHorseForm) {
        addHorseForm.addEventListener("submit", event => {
            event.preventDefault();
            clearFormMessage();

            const name = getFieldValue("horse-name");

            if (!name) {
                setFormMessage("Please enter a horse name.", "error");
                return;
            }

            const existingHorse = editingHorseId
                ? horses.find(horse => horse.id === editingHorseId)
                : null;

            const horseData = {
                id: editingHorseId || `horse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                hrId: getFieldValue("horse-hr-id"),
                breed: getFieldValue("horse-breed"),
                sex: getFieldValue("horse-sex"),
                dob: getFieldValue("horse-dob"),
                gp: getFieldValue("horse-gp"),
                coi: getFieldValue("horse-coi"),
                sire: getFieldValue("horse-sire"),
                dam: getFieldValue("horse-dam"),
                photo: getFieldValue("horse-photo"),
                notes: getFieldValue("horse-notes"),
                status: existingHorse?.status || "active",
                createdAt: existingHorse?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                health: {},
                gpTraits: {},
                conformationTraits: {},
                showRecords: existingHorse?.showRecords || [],
                achievements: existingHorse?.achievements || {},
                market: existingHorse?.market || {},
                listedForSale: existingHorse?.listedForSale || false,
                lifetimeEarnings: existingHorse?.lifetimeEarnings || 0,
                genotype: existingHorse?.genotype || {}
            };

            Object.keys(healthFields).forEach(key => {
                horseData.health[key] = getFieldValue(`health-${key}`);
            });

            Object.keys(gpFields).forEach(key => {
                horseData.gpTraits[key] = getFieldValue(`gp-${key}`);
            });

            const pastedConformation = getFieldValue("horse-conformation-paste");
            const parsedConformation = parseConformationPaste(pastedConformation);

            Object.keys(conformationFields).forEach(key => {
                const individualValue = getFieldValue(`confo-${key}`);
                const normalizedIndividual = normalizeConformationGrade(individualValue);

                horseData.conformationTraits[key] =
                    normalizedIndividual || parsedConformation[key] || "";
            });

            if (editingHorseId) {
                const index = horses.findIndex(horse => horse.id === editingHorseId);

                if (index !== -1) {
                    horses[index] = {
                        ...horses[index],
                        ...horseData,
                        showRecords: horses[index].showRecords || [],
                        achievements: horses[index].achievements || {},
                        market: horses[index].market || {},
                        genotype: horses[index].genotype || {}
                    };
                }

                setFormMessage("Horse record updated successfully.");
            } else {
                horses.push(horseData);
                setFormMessage("Horse added successfully.");
            }

            saveHorses();
            renderHorses();

            if (editingHorseId) {
                selectedHorseId = editingHorseId;
            }

            editingHorseId = null;

            if (addHorseForm) addHorseForm.reset();

            const heading = document.getElementById("add-horse-heading");
            if (heading) heading.textContent = "Add New Horse";

            if (editHorseButton) editHorseButton.textContent = "Save Horse";

            setTimeout(() => {
                openPage("horses");
            }, 700);
        });
    }

    // HORSE PROFILE
    function openHorseProfile(horseId) {
        const horse = horses.find(item => item.id === horseId);
        if (!horse) return;

        selectedHorseId = horseId;
        updateHorseProfile(horse);
        openPage("profile");
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = displayValue(value);
    }

    function updateHorseProfile(horse) {
        if (!horse) return;

        setText("profile-horse-name", horse.name);
        setText("profile-horse-breed", horse.breed);
        setText("profile-horse-sex", horse.sex);
        setText("profile-horse-age", calculateAge(horse.dob));
        setText("profile-horse-gp", horse.gp);
        setText("profile-horse-coi", horse.coi);
        setText("profile-horse-hr-id", horse.hrId);
        setText("profile-horse-sire", horse.sire);
        setText("profile-horse-dam", horse.dam);
        setText("profile-horse-status", horse.status || "active");
        setText("profile-horse-notes", horse.notes);

        const photo = document.getElementById("profile-horse-photo");

        if (photo) {
            if (horse.photo) {
                photo.src = horse.photo;
                photo.alt = horse.name || "Horse";
                photo.style.display = "block";
            } else {
                photo.removeAttribute("src");
                photo.alt = "No horse photo";
                photo.style.display = "none";
            }
        }

        const health = horse.health || {};
        Object.keys(healthFields).forEach(key => {
            setText(`profile-health-${key}`, health[key]);
        });

        const gpTraits = horse.gpTraits || {};
        Object.keys(gpFields).forEach(key => {
            setText(`profile-gp-${key}`, gpTraits[key]);
        });

        const conformationTraits = horse.conformationTraits || {};
        Object.keys(conformationFields).forEach(key => {
            setText(`profile-confo-${key}`, conformationTraits[key]);
        });

        updateConformationBreakdown(horse);
        updateMarketProfile(horse);
        renderHorseShowRecords(horse);
        renderHorseAchievements(horse);
        updateCoatColorProfile(horse);
    }

    // CONFORMATION GRADE BREAKDOWN
    function updateConformationBreakdown(horse) {
        const traits = horse.conformationTraits || {};
        const grades = {
            VG: 0,
            "G+": 0,
            G: 0,
            A: 0,
            BA: 0,
            P: 0
        };

        const gplusTraits = [];

        const traitLabels = {
            walk: "Walk",
            trot: "Trot",
            canter: "Canter",
            gallop: "Gallop",
            posture: "Posture",
            head: "Head",
            neck: "Neck",
            back: "Back",
            shoulders: "Shoulders",
            forelegs: "Forelegs",
            hindquarters: "Hindquarters",
            socks: "Socks"
        };

        Object.keys(conformationFields).forEach(key => {
            const grade = normalizeConformationGrade(traits[key]);

            if (Object.prototype.hasOwnProperty.call(grades, grade)) {
                grades[grade]++;
            }

            if (grade === "G+") {
                gplusTraits.push(traitLabels[key]);
            }
        });

        const total = Object.values(grades).reduce((sum, count) => sum + count, 0);
        setText("profile-confo-summary", `${total} / 12 traits graded`);

        setText("profile-confo-vg", grades.VG);
        setText("profile-confo-gplus", grades["G+"]);
        setText("profile-confo-g", grades.G);
        setText("profile-confo-a", grades.A);
        setText("profile-confo-ba", grades.BA);
        setText("profile-confo-p", grades.P);

        const gplusList = document.getElementById("profile-confo-gplus-list");

        if (gplusList) {
            gplusList.innerHTML = "";

            if (gplusTraits.length) {
                gplusTraits.forEach(trait => {
                    const item = document.createElement("li");
                    item.textContent = trait;
                    gplusList.appendChild(item);
                });
            } else {
                const item = document.createElement("li");
                item.textContent = "No G+ traits recorded.";
                gplusList.appendChild(item);
            }
        }
    }

    // SHOW RECORDS
    function renderHorseShowRecords(horse) {
        const container = document.getElementById("profile-show-records");
        if (!container) return;

        container.innerHTML = "";

        const records = Array.isArray(horse.showRecords) ? horse.showRecords : [];

        if (!records.length) {
            const empty = document.createElement("p");
            empty.textContent = "No show records have been added.";
            container.appendChild(empty);
            return;
        }

        records.forEach(record => {
            const item = document.createElement("article");
            item.className = "show-record-card";

            const title = document.createElement("h4");
            title.textContent = record.name || record.type || "Show Record";

            const details = document.createElement("p");
            details.textContent = [
                record.type,
                record.date,
                record.placement,
                record.points ? `${record.points} points` : ""
            ].filter(Boolean).join(" • ");

            const status = document.createElement("span");
            status.textContent = record.confirmed ? "Confirmed" : "Unconfirmed";

            item.append(title, details, status);
            container.appendChild(item);
        });
    }

    // ACHIEVEMENTS
    function renderHorseAchievements(horse) {
        const container = document.getElementById("profile-achievements");
        if (!container) return;

        container.innerHTML = "";

        const achievements = horse.achievements || {};
        const entries = Object.entries(achievements)
            .filter(([, value]) => Number(value) > 0);

        if (!entries.length) {
            const empty = document.createElement("p");
            empty.textContent = "No achievements have been recorded.";
            container.appendChild(empty);
            return;
        }

        entries.forEach(([name, value]) => {
            const item = document.createElement("div");
            item.className = "achievement-item";

            const label = document.createElement("span");
            label.textContent = name;

            const count = document.createElement("strong");
            count.textContent = value;

            item.append(label, count);
            container.appendChild(item);
        });
    }

    // PROFILE ACTIONS
    if (editHorseButton) {
        editHorseButton.addEventListener("click", () => {
            const horse = horses.find(item => item.id === selectedHorseId);
            if (horse) startEditingHorse(horse);
        });
    }

    document.querySelectorAll("[data-horse-status]").forEach(button => {
        button.addEventListener("click", () => {
            if (!selectedHorseId) return;
            changeHorseStatus(selectedHorseId, button.dataset.horseStatus);
        });
    });

    // GENETICS AND COAT COLOR
    const coatColorForm = document.getElementById("coat-color-form");

    function updateCoatColorPreview() {
        const form = coatColorForm;
        if (!form) return;

        const inputs = form.querySelectorAll("input, select");
        const preview = document.getElementById("coat-color-preview");

        if (!preview) return;

        const values = {};

        inputs.forEach(input => {
            if (input.name) values[input.name] = input.value;
        });

        preview.textContent = calculateCoatColor(values);
    }

    function calculateCoatColor(genotype) {
        const genes = genotype || {};
        const extension = String(genes.extension || "E/E").toUpperCase();
        const agouti = String(genes.agouti || "A/A").toUpperCase();
        const cream = String(genes.cream || "N/N").toUpperCase();
        const grey = String(genes.grey || "N/N").toUpperCase();
        const dun = String(genes.dun || "N/N").toUpperCase();
        const silver = String(genes.silver || "N/N").toUpperCase();
        const champagne = String(genes.champagne || "N/N").toUpperCase();
        const pearl = String(genes.pearl || "N/N").toUpperCase();
        const flaxen = String(genes.flaxen || "N/N").toUpperCase();
        const tobiano = String(genes.tobiano || "N/N").toUpperCase();
        const frame = String(genes.frame || "N/N").toUpperCase();
        const sabino = String(genes.sabino || "N/N").toUpperCase();
        const splash = String(genes.splash || "N/N").toUpperCase();
        const roan = String(genes.roan || "N/N").toUpperCase();
        const leopard = String(genes.leopard || "N/N").toUpperCase();
        const varnish = String(genes.varnish || "N/N").toUpperCase();

        const has = (gene, allele) => gene.includes(allele) && !gene.includes("N/N");
        const hasCream = has(cream, "Cr");
        const hasGrey = has(grey, "G");
        const hasDun = has(dun, "D");
        const hasSilver = has(silver, "Z");
        const hasChampagne = has(champagne, "Ch");
        const hasPearl = has(pearl, "Prl");
        const hasFlaxen = has(flaxen, "F");
        const hasTobiano = has(tobiano, "TO");
        const hasFrame = has(frame, "O");
        const hasSabino = has(sabino, "Sb");
        const hasSplash = has(splash, "Spl");
        const hasRoan = has(roan, "Rn");
        const hasLeopard = has(leopard, "Lp");
        const hasVarnish = has(varnish, "V");

        let baseColor = "Chestnut";

        if (extension.includes("E")) {
            if (agouti.includes("A")) {
                baseColor = "Bay";
            } else {
                baseColor = "Black";
            }
        }

        if (hasCream) {
            if (baseColor === "Chestnut") {
                baseColor = "Palomino";
                if (cream.includes("Cr/Cr")) baseColor = "Cremello";
            } else if (baseColor === "Bay") {
                baseColor = cream.includes("Cr/Cr") ? "Perlino" : "Buckskin";
            } else {
                baseColor = cream.includes("Cr/Cr") ? "Smoky Cream" : "Smoky Black";
            }
        }

        if (hasChampagne) {
            if (baseColor === "Chestnut" || baseColor === "Palomino" ||
                baseColor === "Cremello") {
                baseColor = "Gold Champagne";
            } else if (baseColor === "Bay" || baseColor === "Buckskin" ||
                baseColor === "Perlino") {
                baseColor = "Amber Champagne";
            } else {
                baseColor = "Classic Champagne";
            }
        }

        if (hasSilver && (baseColor === "Black" || baseColor === "Smoky Black" ||
            baseColor === "Classic Champagne")) {
            baseColor = "Silver " + baseColor;
        }

        if (hasDun) {
            baseColor = "Dun " + baseColor;
        }

        if (hasPearl) {
            baseColor = "Pearl " + baseColor;
        }

        if (hasFlaxen && (baseColor === "Chestnut" || baseColor === "Palomino")) {
            baseColor = "Flaxen " + baseColor;
        }

        if (hasRoan) baseColor += " Roan";

        const patterns = [];

        if (hasTobiano) patterns.push("Tobiano");
        if (hasFrame) patterns.push("Frame Overo");
        if (hasSabino) patterns.push("Sabino");
        if (hasSplash) patterns.push("Splash White");

        if (hasLeopard) {
            patterns.push("Leopard Complex");
        }

        if (hasVarnish) {
            patterns.push("Varnish Roan");
        }

        let result = baseColor;

        if (patterns.length) {
            result += " with " + patterns.join(" / ");
        }

        if (hasGrey) {
            result += " (Grey)";
        }

        return result;
    }

    if (coatColorForm) {
        coatColorForm.addEventListener("input", updateCoatColorPreview);
        coatColorForm.addEventListener("change", updateCoatColorPreview);
    }

    // SAVE GENETICS TO SELECTED HORSE
    const saveGeneticsButton = document.getElementById("save-genetics-button");

    if (saveGeneticsButton) {
        saveGeneticsButton.addEventListener("click", () => {
            const horse = horses.find(item => item.id === selectedHorseId);

            if (!horse || !coatColorForm) return;

            const formData = new FormData(coatColorForm);
            const genotype = {};

            formData.forEach((value, key) => {
                genotype[key] = String(value);
            });

            horse.genotype = genotype;
            horse.coatColor = calculateCoatColor(genotype);
            horse.updatedAt = new Date().toISOString();

            saveHorses();
            setText("profile-horse-coat-color", horse.coatColor);
            updateCoatColorPreview();
        });
    }

    function updateCoatColorProfile(horse) {
        if (!horse) return;

        const genotype = horse.genotype || {};
        const color = horse.coatColor || calculateCoatColor(genotype);

        setText("profile-horse-coat-color", color);

        if (!coatColorForm) return;

        Object.entries(genotype).forEach(([key, value]) => {
            const field = coatColorForm.elements.namedItem(key);
            if (field) field.value = value;
        });

        updateCoatColorPreview();
    }

    // MARKET PRICING
    function formatHrc(value) {
        if (value === null || value === undefined || value === "") {
            return "Not applicable";
        }

        return `${Math.round(Number(value) || 0).toLocaleString("en-US")} HRC`;
    }

    function averageGradeScore(traits) {
        if (!traits || typeof traits !== "object") return null;

        const gradeScores = {
            VG: 0.95,
            "G+": 0.85,
            G: 0.75,
            A: 0.65,
            BA: 0.5,
            P: 0.3
        };

        const scores = Object.values(traits)
            .map(value => gradeScores[normalizeConformationGrade(value)])
            .filter(value => Number.isFinite(value));

        if (!scores.length) return null;

        return scores.reduce((sum, value) => sum + value, 0) / scores.length;
    }

    function averageHealthScore(health) {
        if (!health || typeof health !== "object") return null;

        const values = Object.values(health)
            .map(value => Number(value))
            .filter(value => Number.isFinite(value) && value >= 0);

        if (!values.length) return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length / 100;
    }

    function calculateHorseValuation(horse) {
        const age = calculateNumericAge(horse);
        const normalizedBreed = String(horse.breed || "").toLowerCase();
        const gp = Number(horse.gp);
        const hasGp = horse.gp !== null && horse.gp !== undefined &&
            horse.gp !== "" && Number.isFinite(gp);
        const conformation = averageGradeScore(horse.conformationTraits);
        const health = averageHealthScore(horse.health);
        const records = Array.isArray(horse.showRecords) ? horse.showRecords : [];
        const conformationShows = records.filter(record => record.type === "Conformation");
        const competitionShows = records.filter(record => record.type === "Competition");
        const achievements = horse.achievements || {};
        const achievementTotal = Object.values(achievements)
            .reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
        const lifetimeEarnings = Math.max(0, Number(horse.lifetimeEarnings) || 0);

        // Appaloosa is the only breed with reference ranges currently configured.
        let baseValue;
        let benchmarkStatus;

        if (normalizedBreed.includes("appaloosa")) {
            if (age >= 0 && age <= 2) {
                baseValue = 6000;
            } else if (age >= 3 && age <= 15) {
                baseValue = competitionShows.length > 0 ? 15000 : 9000;
            } else {
                baseValue = 3500;
            }
            benchmarkStatus = "Appaloosa reference range";
        } else {
            baseValue = age >= 0 && age <= 2 ? 5000 : (age > 15 ? 3000 : 6500);
            benchmarkStatus = "Provisional baseline — breed-specific reference not configured";
        }

        let qualityFactor = 1;

        if (hasGp) {
            qualityFactor *= 0.75 + Math.max(0, Math.min(1000, gp)) / 1000 * 0.5;
        }

        if (conformation !== null) {
            qualityFactor *= 0.78 + conformation * 0.44;
        }

        if (health !== null) {
            qualityFactor *= 0.82 + health * 0.28;
        }

        const coiText = String(horse.coi || "").replace("%", "").trim();
        const coi = Number(coiText);

        if (coiText && Number.isFinite(coi)) {
            if (coi >= 10) qualityFactor *= 0.82;
            else if (coi >= 5) qualityFactor *= 0.92;
        }

        qualityFactor += Math.min(conformationShows.length, 10) * 0.015;
        qualityFactor += Math.min(competitionShows.length, 10) * 0.025;
        qualityFactor += Math.min(achievementTotal, 30) * 0.006;

        if (lifetimeEarnings > 0) {
            qualityFactor += Math.min(Math.log10(lifetimeEarnings + 1) * 0.025, 0.12);
        }

        const genotype = horse.genotype || {};
        const completeGeneCount = Object.values(genotype)
            .filter(value => typeof value === "string" && value.includes("/")).length;

        if (completeGeneCount >= 5) qualityFactor += 0.04;

        if (normalizedBreed.includes("appaloosa") &&
            String(genotype.lp || "").toUpperCase().includes("LP")) {
            qualityFactor += 0.035;
        }

        qualityFactor = Math.max(0.55, Math.min(1.8, qualityFactor));

        const buyout = Math.max(500, Math.round((baseValue * qualityFactor) / 100) * 100);
        const startingBid = Math.max(250, Math.round((buyout * 0.7) / 50) * 50);

        const isBreedingStallion = String(horse.sex || "").toLowerCase() === "stallion";
        let studFee = null;

        if (isBreedingStallion) {
            const breedingScore = qualityFactor +
                Math.min(competitionShows.length, 8) * 0.025 +
                Math.min(achievementTotal, 20) * 0.008;

            if (normalizedBreed.includes("appaloosa")) {
                if (breedingScore >= 1.45 || lifetimeEarnings >= 10000) {
                    studFee = 1500;
                } else if (breedingScore >= 1.12 || competitionShows.length > 0 ||
                    conformationShows.length > 0) {
                    studFee = 1000;
                } else {
                    studFee = 600;
                }
            } else {
                studFee = Math.max(300, Math.round((buyout * 0.075) / 50) * 50);
            }
        }

        return {
            startingBid,
            buyout,
            studFee,
            benchmarkStatus,
            gp: hasGp ? `${gp} / 1000` : "Not entered",
            conformation: conformation === null
                ? "Not entered"
                : `${Math.round(conformation * 100)}% average grade score`,
            showRecord: `${conformationShows.length} conformation show(s)`,
            competitionRecord: `${competitionShows.length} competition show(s)`,
            offspringRecord: "Not linked in current horse records",
            breedingValue: isBreedingStallion
                ? "Eligible stallion — estimated fee available"
                : "Not applicable — stallion only"
        };
    }

    function updateMarketProfile(horse) {
        if (!horse) return;

        const valuation = calculateHorseValuation(horse);

        setText("profile-suggested-starting-bid", formatHrc(valuation.startingBid));
        setText("profile-suggested-buyout-price", formatHrc(valuation.buyout));
        setText("profile-suggested-stud-fee", formatHrc(valuation.studFee));
        setText("profile-market-gp", valuation.gp);
        setText("profile-market-conformation", valuation.conformation);
        setText("profile-market-show-record", valuation.showRecord);
        setText("profile-market-competition-record", valuation.competitionRecord);
        setText("profile-market-offspring-record", valuation.offspringRecord);
        setText("profile-market-breeding-value", valuation.breedingValue);

        const message = document.getElementById("profile-market-message");

        if (message) {
            message.textContent = valuation.benchmarkStatus;
        }
    }

    // MARKET OVERVIEW: suggested buyout and stud-fee ranges by breed.
    // Starting Bid remains visible only inside an individual horse profile.
    function renderMarketOverview() {
        const container = document.getElementById("market-overview-by-breed");
        if (!container) return;

        const breedGroups = {};

        horses.forEach(horse => {
            const breed = horse.breed || "Other";
            const valuation = calculateHorseValuation(horse);

            if (!breedGroups[breed]) {
                breedGroups[breed] = { buyouts: [], studFees: [] };
            }

            if (Number.isFinite(valuation.buyout)) {
                breedGroups[breed].buyouts.push(valuation.buyout);
            }

            if (Number.isFinite(valuation.studFee)) {
                breedGroups[breed].studFees.push(valuation.studFee);
            }
        });

        container.innerHTML = "";

        const breeds = Object.keys(breedGroups).sort((a, b) => a.localeCompare(b));

        if (!breeds.length) {
            const empty = document.createElement("div");
            empty.className = "profile-empty-content";
            empty.textContent = "Breed market summaries will appear here when horse records are available.";
            container.appendChild(empty);
            return;
        }

        breeds.forEach(breed => {
            const values = breedGroups[breed];
            const card = document.createElement("article");
            card.className = "market-breed-card";

            const heading = document.createElement("h4");
            heading.textContent = breed;

            const buyoutLabel = document.createElement("span");
            buyoutLabel.textContent = "Suggested Buyout Price";

            const buyoutValue = document.createElement("strong");
            buyoutValue.textContent = values.buyouts.length
                ? `${formatHrc(Math.min(...values.buyouts))} – ${formatHrc(Math.max(...values.buyouts))}`
                : "Not calculated";

            const feeLabel = document.createElement("span");
            feeLabel.textContent = "Suggested Stud Fee";

            const feeValue = document.createElement("strong");
            feeValue.textContent = values.studFees.length
                ? `${formatHrc(Math.min(...values.studFees))} – ${formatHrc(Math.max(...values.studFees))}`
                : "No eligible stallions";

            card.append(heading, buyoutLabel, buyoutValue, feeLabel, feeValue);
            container.appendChild(card);
        });
    }

    // STATUS / RECORD ACTIONS
    function changeHorseStatus(horseId, newStatus) {
        const horse = horses.find(item => item.id === horseId);
        if (!horse) return;

        const allowedStatuses = ["active", "sold", "retired", "deceased"];

        if (!allowedStatuses.includes(newStatus)) return;

        horse.status = newStatus;
        horse.updatedAt = new Date().toISOString();

        saveHorses();
        renderHorses();

        if (selectedHorseId === horseId) {
            updateHorseProfile(horse);
        }
    }

    // PUBLIC STATUS HELPERS FOR FUTURE PROFILE ACTIONS
    window.vsmChangeHorseStatus = changeHorseStatus;

    // ENSURE LEGACY HORSE RECORDS HAVE REQUIRED DEFAULTS
    horses.forEach(horse => {
        if (!horse.id) {
            horse.id = `horse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }

        if (!horse.status) horse.status = "active";
        if (!Array.isArray(horse.showRecords)) horse.showRecords = [];
        if (!horse.achievements || typeof horse.achievements !== "object") {
            horse.achievements = {};
        }
        if (!horse.market || typeof horse.market !== "object") {
            horse.market = {};
        }

        // Keep existing show record types intact.
        horse.showRecords.forEach(record => {
            if (!record.id) {
                record.id = `show-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            }

            if (record.confirmed === undefined) {
                record.confirmed = false;
            }
        });
    });

    saveHorses();

    // INITIAL DISPLAY
    updateCoatColorPreview();
    renderMarketOverview();
    renderHorses();

    console.log("Virtual Stable Manager V1.0 initialized.");
});