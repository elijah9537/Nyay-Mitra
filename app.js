document.addEventListener("DOMContentLoaded", function () {
    // Nearby Police Station logic with embedded map
    const policeBtn = document.getElementById("find-police-btn");
    const policeResult = document.getElementById("police-result");
    const mapContainer = document.getElementById("map-container");
    const policeMap = document.getElementById("police-map");
    
    if (policeBtn && policeResult) {
        policeBtn.addEventListener("click", function () {
            policeBtn.disabled = true;
            policeResult.textContent = "Detecting your location...";
            if (mapContainer) mapContainer.classList.add("hidden");
            
            if (!navigator.geolocation) {
                policeResult.innerHTML = '<span class="police-error">Geolocation is not supported by your browser.</span>';
                policeBtn.disabled = false;
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    
                    // Create embedded map
                    if (policeMap && mapContainer) {
                        // Create iframe for embedded map
                        const mapIframe = document.createElement('iframe');
                        mapIframe.width = "100%";
                        mapIframe.height = "400";
                        mapIframe.style.border = "0";
                        mapIframe.loading = "lazy";
                        mapIframe.allowFullscreen = true;
                        mapIframe.referrerPolicy = "no-referrer-when-downgrade";
                        
                        // Fetch the Google Maps API key from our server
                        fetch('/api/maps-key')
                            .then(response => response.json())
                            .then(data => {
                                const apiKey = data.key;
                                // Set the Google Maps URL with the user's current location
                                mapIframe.src = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=police+station&center=${lat},${lng}&zoom=14`;
                                
                                // Clear any existing content and add the iframe
                                policeMap.innerHTML = '';
                                policeMap.appendChild(mapIframe);
                                
                                // Handle iframe loading errors
                                mapIframe.onerror = () => {
                                    handleMapError();
                                };
                                
                                // Add event listener to detect if iframe failed to load
                                mapIframe.addEventListener('load', () => {
                                    // Check if the iframe contains an error message from Google Maps
                                    try {
                                        setTimeout(() => {
                                            if (mapIframe.contentDocument && 
                                                mapIframe.contentDocument.body && 
                                                mapIframe.contentDocument.body.innerText.includes('error')) {
                                                handleMapError();
                                            }
                                        }, 1000);
                                    } catch (e) {
                                        // Cannot access iframe content due to CORS, assume it loaded correctly
                                    }
                                });
                            })
                            .catch(error => {
                                console.error('Error fetching Google Maps API key:', error);
                                // Fallback if API key fetch fails
                                const mapsUrl = `https://www.google.com/maps/search/police+station/@${lat},${lng},15z`;
                                policeResult.innerHTML = `<b>Location found!</b><br><a href="${mapsUrl}" target="_blank" rel="noopener" class="police-map-link">View nearby police stations on Google Maps</a>`;
                            });
                        
                        // Show success message and map container
                        policeResult.innerHTML = `<b>Location found!</b> Showing police stations near you.`;
                        mapContainer.classList.remove("hidden");
                        
                        // Also provide a direct link to Google Maps
                        const mapsUrl = `https://www.google.com/maps/search/police+station/@${lat},${lng},15z`;
                        policeResult.innerHTML += `<br><a href="${mapsUrl}" target="_blank" rel="noopener" class="police-map-link">Open in Google Maps</a>`;
                    } else {
                        // Fallback if map container not found
                        const mapsUrl = `https://www.google.com/maps/search/police+station/@${lat},${lng},15z`;
                        policeResult.innerHTML = `<b>Location found!</b><br><a href="${mapsUrl}" target="_blank" rel="noopener" class="police-map-link">View nearby police stations on Google Maps</a>`;
                    }
                    
                    // Function to handle map loading errors
                    function handleMapError() {
                        console.warn('Google Maps failed to load properly');
                        const mapsUrl = `https://www.google.com/maps/search/police+station/@${lat},${lng},15z`;
                        policeResult.innerHTML = `<b>Location found!</b><br>
                            <p class="mb-2">We couldn't load the map directly. Please use the link below:</p>
                            <a href="${mapsUrl}" target="_blank" rel="noopener" class="police-map-link">View nearby police stations on Google Maps</a>`;
                        
                        // Hide the map container since it's not working
                        if (mapContainer) {
                            mapContainer.classList.add("hidden");
                        }
                    }
                    
                    policeBtn.disabled = false;
                },
                (err) => {
                    policeResult.innerHTML = `<span class="police-error">Unable to get your location. (${err.message})</span>`;
                    policeBtn.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
});

// This appData object holds all the informational content for the Nyay-mitra platform.
// It's structured to make it easy to manage and render the content dynamically.
const appData = {
    rights: [
        {
            title: 'If you are a victim of Assault, Hurt, or Robbery...',
            content: 'The crime committed against you is a direct violation of your <strong>Right to Life and Personal Liberty (Article 21)</strong>. This is the most fundamental right, guaranteeing your right to live with human dignity, free from physical harm and fear. The law ensures that no one can take away your life or liberty except according to a procedure established by law.'
        },
        {
            title: 'If you are a victim of Theft or Cheating...',
            content: 'While there isn\'t a specific fundamental right to property in the same way, these crimes infringe upon your legal right to property, which is protected under <strong>Article 300-A</strong> of the Constitution. More importantly, such acts violate your <strong>Right to Life (Article 21)</strong> in a broader sense, as they disrupt your ability to live a peaceful and secure life, which is an integral part of your personal liberty.'
        },
        {
            title: 'If you are a victim of Discrimination...',
            content: 'Any discrimination against you based on your religion, race, caste, sex, or place of birth is a violation of your <strong>Right to Equality (Articles 14 & 15)</strong>. This right ensures that you are treated equally before the law and that the state cannot discriminate against you on these grounds. If you are denied access to a public place, shop, or restaurant for these reasons, your fundamental rights have been violated.'
        },
        {
            title: 'If you are a victim of Human Trafficking or Forced Labour...',
            content: 'This is a grave violation of your <strong>Right Against Exploitation (Articles 23 & 24)</strong>. The Constitution explicitly prohibits trafficking in human beings and all forms of forced labour. This right protects your dignity and ensures that you cannot be treated as a commodity or forced to work against your will.'
        },
        {
            title: 'If you are prevented from practicing your religion...',
            content: 'This infringes upon your <strong>Right to Freedom of Religion (Article 25)</strong>. This right guarantees you the freedom of conscience and the right to freely profess, practice, and propagate your religion, subject to public order, morality, and health.'
        },
        {
            title: 'If your rights are violated and you get no help...',
            content: 'You can invoke your <strong>Right to Constitutional Remedies (Article 32)</strong>. This is your most powerful right, allowing you to directly approach the Supreme Court (or the High Court under Article 226) to seek enforcement of your fundamental rights. It is the right that makes all other rights effective.'
        }
    ],
    crimes: [
        { category: 'property', name: 'Theft', ipc: '378, 379', bns: '303', change: 'Community service is now a possible punishment for first-time offenders stealing property under Rs. 5,000 if returned. Repeat offender punishments are enhanced.' },
        { category: 'property', name: 'Cheating', ipc: '415, 420', bns: '318', change: 'All forms of cheating are consolidated. Simple cheating punishment is increased from 1 year to up to 3 years.' },
        { category: 'property', name: 'Criminal Breach of Trust', ipc: '405, 406', bns: '316', change: 'Maximum punishment is increased from 3 years to 5 years, showing a stricter stance on abuses of trust.' },
        { category: 'state', name: 'Sedition', ipc: '124A', bns: 'Replaced', change: 'The offence of sedition is deleted. It is replaced by a new, broader offence under Section 152 for "Acts Endangering Sovereignty, Unity and Integrity of India".' },
        { category: 'body', name: 'Mob Lynching', ipc: 'Not Specified', bns: '103(2)', change: 'A new, specific offence. Murder by a group of 5 or more on grounds of race, caste, etc., is now a distinct crime with severe penalties (life imprisonment or death).' },
        { category: 'body', name: 'Causing Death by Negligence', ipc: '304A', bns: '106(1)', change: 'Punishment significantly increased from a maximum of 2 years to up to 5 years imprisonment and a fine.' },
        { category: 'body', name: 'Hit-and-Run', ipc: 'Not Specified', bns: '106(2)', change: 'A new offence. If a driver causes death by negligence and flees without reporting, they face up to 10 years in prison and a fine.' },
        { category: 'new', name: 'Terrorism', ipc: 'In special laws', bns: '113', change: 'Terrorism is defined and criminalized in the general penal code for the first time, with a broad definition.' },
        { category: 'new', name: 'Organised Crime', ipc: 'In special laws', bns: '111', change: 'Organised crime (e.g., kidnapping, extortion by syndicates) is now a specific offence in the BNS.' },
        { category: 'sexual', name: 'Sexual Intercourse by Deceit', ipc: 'Not Specified', bns: '69', change: 'A new offence criminalizing sexual intercourse with a woman by deceitful means or a false promise to marry, punishable with up to 10 years imprisonment.' },
        { category: 'sexual', name: 'Assault/Force to Outrage Modesty', ipc: '354, 354A, 354B, 354D', bns: '73, 74, 75, 78', change: 'This covers a range of acts including sexual harassment, assault with intent to disrobe, voyeurism, and stalking. The BNS has consolidated and in some cases enhanced punishments for these critical offences against women.' },
        { category: 'sexual', name: 'Rape of Men/Transgender Persons', ipc: '377 (partially)', bns: 'Omitted', change: 'The omission of IPC Section 377 has created a legal void for prosecuting non-consensual penetrative sexual assault against adult men and transgender individuals.' },
        { category: 'other', name: 'Defamation', ipc: '499, 500', bns: '356', change: 'Making or publishing any imputation concerning any person intending to harm their reputation. The BNS now includes community service as a possible punishment.' },
        { category: 'other', name: 'Criminal Intimidation', ipc: '503, 506', bns: '351', change: 'Threatening another person with injury to their person, property, or reputation. The BNS has reorganized these provisions.' },
        { category: 'other', name: 'Public Nuisance', ipc: '268', bns: '290', change: 'Any act or illegal omission which causes any common injury, danger or annoyance to the public. The BNS has enhanced the penalty for this offence.' }
    ],
    punishmentData: {
        labels: ['Cheating (Simple)', 'Criminal Breach of Trust', 'Death by Negligence'],
        ipc: [1, 3, 2],
        bns: [3, 5, 5]
    },
    actionPlan: [
         {
            step: 'Step 1: Reporting the Crime',
            icon: '&#128221;',
            content: `<strong>For Serious (Cognizable) Offences:</strong> Go to any police station. They MUST register a <strong>First Information Report (FIR)</strong>. You have a right to a free copy. If the crime happened elsewhere, they must file a <strong>"Zero FIR"</strong> and transfer it.<br><br><strong>For Less Serious (Non-Cognizable) Offences:</strong> File a complaint directly with the local Judicial Magistrate.<br><br><strong>What if Police Refuse to File an FIR?</strong><ol class="list-decimal list-inside mt-2"><li>Send a written complaint by post to a senior officer (e.g., Superintendent of Police).</li><li>If there's still no action, file a private complaint with a Magistrate under Section 156(3) of the CrPC/BNSS.</li></ol>`
        },
        {
            step: 'Step 2: The Investigation Process',
            icon: '&#128269;',
            content: `The police will begin the investigation. This involves:<ul class="list-disc list-inside mt-2"><li>Visiting the crime scene to gather evidence.</li><li>Collecting physical, digital, and forensic evidence.</li><li>Recording statements from the victim, witnesses, and accused.</li><li>If necessary, making an arrest (for cognizable offences).</li></ul>As a victim, you have the right to be kept informed of the investigation's progress.`
        },
        {
            step: 'Step 3: The Victim\'s Role & Medical Exam',
            icon: '&#128117;',
            content: `Your cooperation is crucial. You are often the key witness.<br><br><strong>Medico-Legal Exam (For Assault Victims):</strong> This is vital for evidence and treatment.<ul class="list-disc list-inside mt-2"><li><strong>Your Consent is Required:</strong> The exam cannot be done without your informed consent.</li><li><strong>Your Rights:</strong> You can have a support person present. The degrading "two-finger test" is banned.</li><li><strong>Free Treatment:</strong> All hospitals (public and private) must provide free first-aid and treatment.</li></ul>`
        },
        {
            step: 'Step 4: Trial and Judgment',
            icon: '&#9878;',
            content: `After investigation, police file a <strong>Charge Sheet</strong> in court.<br><br><strong>The Trial:</strong><ul class="list-disc list-inside mt-2"><li>The court frames charges against the accused.</li><li>The prosecution (the state's lawyer) presents evidence to prove guilt "beyond a reasonable doubt".</li><li>You will be called as a witness to give testimony (Chief Examination and Cross-Examination).</li><li>The defense presents its case.</li></ul><strong>The Judgment:</strong> The judge delivers the final verdict. If guilty, a sentence (punishment) is given. Both sides have the right to appeal.`
        }
    ],
    scenarioGuides: [
        {
            title: 'In Case of Theft or Robbery',
            icon: '&#128178;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Prioritize Safety:</strong> If it's a robbery, do not resist. Your life is more valuable than your belongings. Try to remember the attacker's appearance.</li><li><strong>Secure Your Accounts:</strong> Immediately call your bank(s) to block all stolen debit/credit cards. Also block any SIM cards that were stolen.</li><li><strong>Whom to Approach:</strong> Go to the nearest <strong>police station</strong> and file an FIR. Provide a detailed list of all stolen items and their estimated value. Get a free copy of the FIR.</li><li><strong>Inform Authorities:</strong> Use the FIR copy to apply for duplicate documents like your Driver's License, PAN card, etc., if they were stolen.</li></ol>`
        },
        {
            title: 'In Case of a Road Accident',
            icon: '&#128663;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Check for Injuries:</strong> Assess yourself and others for injuries. <strong>Whom to Approach:</strong> Call for an <strong>ambulance (Dial 102/108)</strong> and the <strong>Police (Dial 112)</strong> immediately. Do not move a seriously injured person unless they are in immediate danger.</li><li><strong>Document the Scene:</strong> If it is safe, take pictures of the accident scene, vehicle damage, and any visible injuries.</li><li><strong>Exchange Information:</strong> Get the name, address, phone number, and insurance details of the other driver(s) involved. Note down their vehicle registration number.</li><li><strong>File a Report:</strong> File a General Diary (GD) entry or an FIR at the nearest <strong>police station</strong>. This is crucial for insurance claims and any legal action.</li></ol>`
        },
        {
            title: 'In Case of Online Financial Fraud',
            icon: '&#128187;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Act Immediately - Whom to Approach (1):</strong> Call the <strong>National Cyber Crime Helpline at 1930</strong>. This is the first and most critical step to try and stop the fraudulent transaction.</li><li><strong>Whom to Approach (2):</strong> Go to <strong>www.cybercrime.gov.in</strong> and file a formal complaint on the <strong>National Cyber Crime Reporting Portal</strong>. Provide all details like transaction IDs and screenshots.</li><li><strong>Whom to Approach (3):</strong> Contact your <strong>Bank</strong>, explain the fraud, and request them to block the transaction and your card/account if necessary.</li><li><strong>Change Passwords:</strong> If you suspect any of your passwords have been compromised, change them immediately for all important accounts.</li></ol>`
        },
        {
            title: 'In Case of Stalking or Harassment',
            icon: '&#128100;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Preserve Evidence:</strong> Do not delete messages, emails, or call logs. Take screenshots of online posts or profiles. Note down dates, times, and locations of incidents.</li><li><strong>Whom to Approach (Police):</strong> Report the matter to the nearest <strong>police station</strong> and file an FIR. Stalking (BNS 78) is a cognizable offence.</li><li><strong>Whom to Approach (Helplines):</strong> Call the <strong>National Women's Helpline at 181</strong> or your local <strong>Women Police Helpline (1091)</strong> for immediate advice and support.</li><li><strong>Block the Person:</strong> Block the harasser on all social media platforms and your phone. Inform your friends and family about the situation.</li><li><strong>Cyber Crime Portal:</strong> If the harassment is online, you can also report it on the <strong>National Cyber Crime Reporting Portal</strong>.</li></ol>`
        },
        {
            title: 'In Case of Domestic Violence',
            icon: '&#128106;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Ensure Immediate Safety:</strong> If you are in immediate danger, leave the house and go to a safe place (a friend, relative, or public area).</li><li><strong>Whom to Approach (Helplines):</strong> Call the <strong>National Women's Helpline at 181</strong> or the <strong>Women Police Helpline (often 1091)</strong> for immediate assistance and counseling.</li><li><strong>Whom to Approach (Police):</strong> Go to the nearest <strong>police station</strong> to file a Domestic Incident Report (DIR) or an FIR. You can also approach a Protection Officer appointed under the PWDVA, 2005.</li><li><strong>Whom to Approach (NCW):</strong> You can file a complaint with the <strong>National Commission for Women (NCW)</strong> online. They can take up the matter with the police.</li><li><strong>Seek Legal and Medical Help:</strong> Get a medico-legal examination done for any injuries. Contact a lawyer or a Legal Services Authority for free legal aid to file a case under the Protection of Women from Domestic Violence Act (PWDVA).</li></ol>`
        },
        {
            title: 'In Case of Public Nuisance (e.g., Loud Noise)',
            icon: '&#128266;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Initial Request:</strong> If you feel safe doing so, you can first make a polite request to the person causing the nuisance to stop.</li><li><strong>Whom to Approach:</strong> If the nuisance continues, especially during late hours, call the <strong>Police Control Room (PCR) by dialing 112</strong>. Explain the situation, your location, and the nature of the disturbance.</li><li><strong>Provide Details:</strong> The police may ask for your details, which you can provide. You can request to remain anonymous if you have safety concerns. The police are obligated to visit the location and address the complaint.</li></ol>`
        },
        {
            title: 'In Case of General Fraud or Cheating',
            icon: '&#128220;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Gather All Evidence:</strong> Collect all documents related to the fraud, such as receipts, bills, contracts, agreements, and any written communication with the accused person/company.</li><li><strong>Whom to Approach (Police):</strong> File a detailed written complaint at your local <strong>police station</strong>. If the police are convinced a cognizable offence of cheating has occurred, they will register an FIR.</li><li><strong>Whom to Approach (Consumer Forum):</strong> If the fraud relates to defective goods or deficient services from a business, you can file a complaint with the <strong>District Consumer Disputes Redressal Commission</strong>.</li><li><strong>Whom to Approach (Civil Court):</strong> For disputes that are primarily contractual or civil in nature (e.g., property disputes), you may need to <strong>consult a lawyer</strong> to file a civil suit for recovery or damages.</li></ol>`
        },
        {
            title: 'In Case of Defamation (Slander/Libel)',
            icon: '&#9997;',
            content: `<ol class="list-decimal list-inside space-y-2"><li><strong>Document the Defamatory Statement:</strong> Preserve evidence. For written defamation (libel), keep copies of the publication (newspaper, social media post, etc.). For spoken defamation (slander), try to have witness accounts.</li><li><strong>Whom to Approach (First Step):</strong> The standard first step is to <strong>contact a lawyer</strong>. The lawyer will typically send a legal notice to the person who made the statement, demanding a public apology and retraction.</li><li><strong>Criminal Complaint:</strong> If the notice is ignored, your lawyer can help you file a criminal complaint for defamation before a <strong>Judicial Magistrate</strong>.</li><li><strong>Civil Lawsuit:</strong> Separately, your lawyer can file a civil suit in a <strong>Civil Court</strong> claiming monetary compensation (damages) for the harm caused to your reputation.</li></ol>`
        }
    ],
    actionChecklists: {
        victim: [
            "Receive a free copy of the FIR.",
            "Be treated with dignity and sensitivity.",
            "Have your statement recorded at home (for certain offences).",
            "Receive free legal aid.",
            "Be informed about the investigation's progress.",
            "Have a support person present during medical exams."
        ],
        arrested: [
            "Be informed of the grounds for arrest.",
            "Be produced before a Magistrate within 24 hours.",
            "Inform a relative or friend about the arrest.",
            "Consult a lawyer of your choice.",
            "Receive free legal aid if unable to afford a lawyer.",
            "Be medically examined. Women cannot be arrested between sunset and sunrise (with exceptions)."
        ]
    },
    protections: [
        {
            id: 'women',
            title: 'For Women',
            icon: '&#9792;',
            content: [
                { title: 'Protection from Domestic Violence (PWDVA, 2005)', text: 'A civil law offering protection from physical, sexual, verbal, emotional, and economic abuse within the family. Victims can get protection orders, residence orders, and monetary relief.' },
                { title: 'Sexual Harassment at Workplace (POSH Act, 2013)', text: 'Mandates that every employer set up an Internal Complaints Committee (ICC) for women to report and seek redressal for sexual harassment.' },
                { title: 'Right Against Dowry', text: 'The Dowry Prohibition Act, 1961, criminalizes giving or taking dowry. Cruelty by a husband or his relatives over dowry is also a serious offence.' },
                { title: 'Equal Pay & Property Rights', text: 'The Equal Remuneration Act mandates equal pay for equal work. The Hindu Succession Act grants daughters equal rights as sons to inherit ancestral property.' }
            ]
        },
        {
            id: 'children',
            title: 'For Children',
            icon: '&#128118;',
            content: [
                { title: 'Protection of Children from Sexual Offences (POCSO) Act, 2012', text: 'A strict, gender-neutral law protecting anyone under 18 from sexual assault, harassment, and pornography. Reporting such crimes is mandatory for all adults who become aware of them.' },
                { title: 'Child-Friendly Procedures', text: 'POCSO mandates special procedures like recording a child\'s statement at their home by a woman officer and trials in special courts to prevent further trauma.' },
                { title: 'Juvenile Justice (JJ) Act, 2015', text: 'This law deals with children in conflict with the law (focusing on reform, not punishment) and children in need of care and protection (e.g., orphans). It establishes Juvenile Justice Boards (JJB) and Child Welfare Committees (CWC).' }
            ]
        },
        {
            id: 'cyber',
            title: 'Cybercrime',
            icon: '&#128187;',
            content: [
                { title: 'The IT Act, 2000 & BNS', text: 'Cybercrimes are governed by the IT Act and relevant sections of the BNS. Offences include Hacking, Identity Theft, Phishing, and Cyber Stalking.' },
                { title: 'What to Do If You Are a Victim:', text: `<ol class="list-decimal list-inside space-y-2 mt-2"><li><strong>Do Not Panic & Do Not Delete:</strong> Preserve all evidence. Take screenshots of messages, profiles, transaction details, URLs, etc. Do not engage further with the perpetrator.</li><li><strong>Report Immediately Online:</strong> The fastest way to report is on the <strong>National Cyber Crime Reporting Portal</strong> at <strong>www.cybercrime.gov.in</strong>. You can report anonymously or as a victim.</li><li><strong>Call the Helpline:</strong> For immediate assistance, especially for financial fraud, call the National Helpline at <strong>1930</strong>.</li><li><strong>Report to the Platform:</strong> Report the abusive profile or content to the social media platform (e.g., Facebook, Instagram, Twitter) directly.</li><li><strong>Approach Local Police:</strong> You can also file a complaint at your local police station or a specialized Cyber Crime Cell.</li></ol>` }
            ]
        },
        {
            id: 'consumers',
            title: 'For Consumers',
            icon: '&#128722;',
            content: [
                { title: 'Consumer Protection Act, 2019', text: 'Protects you against unfair trade practices, defective goods, and poor services. It covers all transactions, including e-commerce.' },
                { title: 'Your Six Consumer Rights', text: 'Right to Safety, Right to be Informed, Right to Choose, Right to be Heard, Right to Seek Redressal, and Right to Consumer Education.' },
                { title: 'Where to Complain', text: 'You can file a complaint in consumer commissions at the District (claims up to ₹1 Cr), State (₹1 Cr - ₹10 Cr), or National (above ₹10 Cr) level.' }
            ]
        }
    ],
    help: [
        { title: 'Cyber Crime Portal', content: 'The official government portal to report all types of cybercrimes, including financial fraud, online harassment, and hacking. You can also call the helpline 1930.', action: 'Report a Cyber Crime', link: 'https://www.cybercrime.gov.in/' },
        { title: 'National Commission for Women', content: 'A statutory body that works to protect and promote the interests of women in India. You can file complaints related to women\'s rights violations.', action: 'Visit NCW', link: 'https://ncw.nic.in/' },
        { title: 'National Commission for Protection of Child Rights', content: 'The apex body for protecting and promoting child rights. It looks into complaints of child rights violations and reviews safeguards.', action: 'Visit NCPCR', link: 'https://ncpcr.gov.in/' },
        { title: 'National Consumer Helpline', content: 'Provides advice and guidance to consumers on dealing with disputes related to goods and services. You can file grievances through this portal.', action: 'File a Grievance', link: 'https://consumerhelpline.gov.in/' },
        { title: 'Right to Information (RTI)', content: 'Empowers you to request information from any public authority to promote transparency. File an application online or offline with a ₹10 fee.', action: 'File an RTI', link: 'https://rtionline.gov.in/' },
        { title: 'Free Legal Aid (NALSA)', content: 'Ensures that no citizen is denied justice due to poverty. Eligible persons can apply for free legal services for their court cases.', action: 'Apply for Aid', link: 'https://nalsa.gov.in/lsams/' },
        { title: 'State Police Services', content: 'Find contact information and online services for the police force in your state or union territory through the national portal of India.', action: 'Find Your State Police', link: 'https://www.india.gov.in/my-government/state-police' },
        { title: 'Human Rights Commissions', content: 'File a complaint with the National (NHRC) or State Human Rights Commission (SHRC) if a public servant violates your human rights.', action: 'File a Complaint', link: 'https://hrcnet.nic.in/' }
    ],
    helplines: [
        { name: 'National Emergency Helpline', number: '112', description: 'A single pan-India number for all emergencies.' },
        { name: 'Police', number: '100', description: 'For immediate police assistance.' },
        { name: 'Women Helpline', number: '181 / 1091', description: 'For women in distress.' },
        { name: 'Child Helpline', number: '1098', description: 'For children in need of care and protection.' },
        { name: 'National Cyber Crime Helpline', number: '1930', description: 'For reporting financial cyber frauds.' },
        { name: 'Senior Citizen Helpline', number: '14567', description: 'For senior citizens facing abuse or in need of assistance.' },
        { name: 'KIRAN - Mental Health Helpline', number: '1800-599-0019', description: 'A national helpline for mental health support.' }
    ],
    documentTemplates: [
        {
            title: 'RTI Application Template',
            description: 'A basic template for filing an application under the Right to Information Act, 2005.',
            template: `To,\nThe Public Information Officer (PIO),\n[Name of the Public Authority/Department]\n[Address of the Public Authority]\n\nSubject: Application under the Right to Information Act, 2005\n\nSir/Madam,\n\nPlease provide me with the following information:\n\n1. [Clearly state the information you are seeking in point form]\n2. [Add more points as necessary]\n\nI am a citizen of India. I am attaching the application fee of Rs. 10/- by way of [Indian Postal Order/Demand Draft/Cash].\n\nPlease provide the information to my address given below.\n\nYours faithfully,\n\n[Your Name]\n[Your Address]\n[Your Phone Number]\nDate: [DD/MM/YYYY]`
        },
        {
            title: 'Consumer Complaint Template',
            description: 'A basic template for filing a complaint with a District Consumer Disputes Redressal Commission.',
            template: `BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION AT [CITY NAME]\n\nComplaint No. ______ of 2024\n\n[Your Name]\n[Your Address]\n... Complainant\n\nVERSUS\n\n[Name of the Opposite Party/Company]\n[Address of the Opposite Party]\n... Opposite Party\n\nSubject: Complaint under Section 35 of the Consumer Protection Act, 2019\n\nSir/Madam,\n\nThe Complainant most respectfully states as under:\n\n1. That the Complainant purchased [Product/Service Name] from the Opposite Party on [Date] for a sum of Rs. [Amount] vide bill/receipt no. [Bill Number]. (A copy of the bill is attached).\n\n2. That the said [Product/Service] has the following defects: [Describe the defects or deficiency in service in detail].\n\n3. That the Complainant contacted the Opposite Party on [Date] to rectify the issue, but they failed to do so. (Copies of communication are attached).\n\nPRAYER:\nIt is, therefore, most respectfully prayed that this Hon'ble Commission may be pleased to direct the Opposite Party to:\n\na) [e.g., Replace the defective product with a new one]\nb) [e.g., Refund the amount of Rs. [Amount]]\nc) Pay a sum of Rs. [Amount] as compensation for mental agony and harassment.\nd) Any other relief which this Hon'ble Commission may deem fit.\n\n[Your Name]\nComplainant`
        }
    ],
    caseStudies: [
        {
            title: 'Vishaka v. State of Rajasthan',
            citation: 'AIR 1997 SC 3011',
            summary: 'This case arose from the brutal gang rape of a social worker in Rajasthan. In its judgment, the Supreme Court acknowledged the absence of any law to address sexual harassment at the workplace and laid down a set of guidelines, known as the "Vishaka Guidelines," for employers to follow to ensure the safety of women at work.',
            keyPrinciple: 'Established that sexual harassment at the workplace is a violation of a woman\'s fundamental rights to equality, life, and liberty. These guidelines were the law of the land until the POSH Act was enacted in 2013.'
        },
        {
            title: 'D.K. Basu v. State of West Bengal',
            citation: 'AIR 1997 SC 610',
            summary: 'This case dealt with the issue of custodial torture and deaths in police custody. The Supreme Court expressed deep concern over police atrocities and laid down 11 mandatory requirements that police must follow during the arrest and detention of any person.',
            keyPrinciple: 'Established strict procedures to be followed during arrest to protect the rights of the arrested person. This includes the right to inform a relative, the right to a medical examination, and the right to consult a lawyer, which are now part of the law.'
        },
        {
            title: 'Shreya Singhal v. Union of India',
            citation: 'AIR 2015 SC 1523',
            summary: 'This case challenged the constitutional validity of Section 66A of the Information Technology Act, 2000, which made it a crime to send "offensive" messages through a computer or communication device. The Supreme Court struck down the section in its entirety.',
            keyPrinciple: 'Upheld the fundamental right to freedom of speech and expression on the internet. The Court found that Section 66A was unconstitutionally vague and had a "chilling effect" on free speech, as people would be afraid to express legitimate opinions for fear of prosecution.'
        }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    // --- CORE WEBSITE INITIALIZATION ---
    function initializeWebsite() {
        lucide.createIcons();
        const contentSections = document.querySelectorAll('.content-section');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIconOpen = document.getElementById('menu-icon-open');
        const menuIconClose = document.getElementById('menu-icon-close');

        // Set up navigation for all internal links
        document.querySelectorAll('.action-link, .home-card, .nav-link').forEach(link => {
            if (link.getAttribute('href')?.startsWith('#')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const hash = this.getAttribute('href');
                    history.pushState(null, null, hash);
                    navigateTo(hash);

                    // Close mobile menu on navigation
                    if (mobileMenu.classList.contains('block')) {
                        mobileMenu.classList.remove('block');
                        mobileMenu.classList.add('hidden');
                        menuIconOpen.classList.remove('hidden');
                        menuIconClose.classList.add('hidden');
                    }
                });
            }
        });

        // Handles showing/hiding content sections based on URL hash
        function navigateTo(hash) {
            if (!hash || hash === '#') hash = '#home';

            contentSections.forEach(section => {
                section.classList.toggle('active', '#' + section.id === hash);
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === hash);
            });
            window.scrollTo(0, 0);
        }

        // Toggles mobile menu visibility
        mobileMenuButton.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('block', !isOpen);
            menuIconOpen.classList.toggle('hidden', !isOpen);
            menuIconClose.classList.toggle('hidden', isOpen);
        });

        // Handles browser back/forward navigation
        window.addEventListener('popstate', () => {
            navigateTo(window.location.hash);
        });

        // --- DYNAMIC CONTENT RENDERING FUNCTIONS ---
        function initRights() {
            const container = document.getElementById('rights-accordion');
            if (!container) return;
            container.innerHTML = appData.rights.map((right, index) => `
                <div class="border border-slate-200 rounded-lg bg-white shadow-sm animate-on-scroll" style="--delay: ${index * 100}ms;">
                    <button class="accordion-toggle w-full flex justify-between items-center p-5 text-left font-semibold text-slate-800 hover:bg-slate-50">
                        <span>${right.title}</span>
                        <span class="transform transition-transform duration-300">
                           <i data-lucide="chevron-down" class="h-5 w-5"></i>
                        </span>
                    </button>
                    <div class="accordion-content px-5 pb-5 text-slate-600">
                        <p>${right.content}</p>
                    </div>
                </div>
            `).join('');
            addAccordionListener(container);
            lucide.createIcons();
        }

        function initCrimes() {
            const grid = document.getElementById('crimes-grid');
            const filter = document.getElementById('crime-category-filter');
            const ctx = document.getElementById('punishmentChart')?.getContext('2d');
            if (!grid || !filter || !ctx) return;

            function renderCrimes(category = 'all') {
                const filteredCrimes = category === 'all' ? appData.crimes : appData.crimes.filter(c => c.category === category);
                grid.innerHTML = filteredCrimes.map((crime, index) => `
                    <div class="bg-white rounded-lg shadow-md p-6 border border-slate-200 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll" style="--delay: ${index * 100}ms;">
                         <div class="mb-3">
                            <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${crime.category}</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900">${crime.name}</h3>
                        <div class="text-sm text-slate-500 my-2">
                            <span class="font-semibold">Old IPC:</span> ${crime.ipc} &rarr; <span class="font-semibold">New BNS:</span> ${crime.bns}
                        </div>
                        <p class="text-slate-600 flex-grow">${crime.change}</p>
                    </div>
                `).join('');
            }

            filter.addEventListener('change', (e) => renderCrimes(e.target.value));

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: appData.punishmentData.labels,
                    datasets: [
                        { label: 'IPC (Max Years)', data: appData.punishmentData.ipc, backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1, borderRadius: 4 },
                        { label: 'BNS (Max Years)', data: appData.punishmentData.bns, backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { title: { display: true, text: 'Punishment Changes: IPC vs. BNS', font: { size: 16, family: 'Poppins' }, padding: { bottom: 20 } }, tooltip: { mode: 'index', intersect: false } },
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'Max Imprisonment (Years)' } } }
                }
            });
            renderCrimes();
        }

        function initActionPlan() {
            const flowchartContainer = document.getElementById('action-flowchart');
            if(flowchartContainer) {
                flowchartContainer.innerHTML = appData.actionPlan.map((item, index) => `
                    <div class="animate-on-scroll" style="--delay: ${index * 100}ms;">
                        <div class="flowchart-step border-2 border-slate-300 rounded-lg p-5 bg-white shadow-sm hover:border-accent hover:bg-blue-50 flex items-center cursor-pointer transition-colors duration-300">
                            <span class="text-3xl mr-5 text-accent">${item.icon}</span>
                            <h3 class="font-semibold text-lg text-slate-800">${item.step}</h3>
                        </div>
                        <div class="flowchart-content pl-16 pr-4 py-2 text-slate-600 bg-slate-50 rounded-b-lg">
                            <div class="border-l-2 border-blue-200 pl-6 py-2">${item.content}</div>
                        </div>
                    </div>
                `).join('');

                flowchartContainer.querySelectorAll('.flowchart-step').forEach(button => {
                    button.addEventListener('click', () => {
                        const content = button.nextElementSibling;
                        const wasActive = button.classList.contains('active');
                        flowchartContainer.querySelectorAll('.flowchart-step').forEach(b => b.classList.remove('active'));
                        flowchartContainer.querySelectorAll('.flowchart-content').forEach(c => c.style.maxHeight = null);
                        if (!wasActive) {
                            button.classList.add('active');
                            content.style.maxHeight = content.scrollHeight + "px";
                        }
                    });
                });
            }

            const scenarioGuidesContainer = document.getElementById('scenario-guides-accordion');
            if(scenarioGuidesContainer) {
                scenarioGuidesContainer.innerHTML = appData.scenarioGuides.map((guide, index) => `
                    <div class="border border-slate-200 rounded-lg bg-white shadow-sm animate-on-scroll" style="--delay: ${index * 100}ms;">
                        <button class="accordion-toggle w-full flex justify-between items-center p-5 text-left font-semibold text-slate-800 hover:bg-slate-50">
                            <span class="flex items-center"><span class="text-2xl mr-4">${guide.icon}</span> ${guide.title}</span>
                            <span class="transform transition-transform duration-300"><i data-lucide="chevron-down" class="h-5 w-5"></i></span>
                        </button>
                        <div class="accordion-content px-5 pb-5 text-slate-600">${guide.content}</div>
                    </div>
                `).join('');
                addAccordionListener(scenarioGuidesContainer);
            }

            const victimChecklistContainer = document.getElementById('victim-checklist-container');
            if(victimChecklistContainer) {
                victimChecklistContainer.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6 h-full">
                        <h4 class="text-xl font-bold text-green-800 mb-4 text-center">Checklist: Victim's Rights</h4>
                        <ul class="space-y-2">
                            ${appData.actionChecklists.victim.map(right => `<li class="flex items-start"><i data-lucide="check-circle" class="text-green-600 mr-2 w-5 h-5 flex-shrink-0 mt-1"></i><span class="text-green-800">${right}</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            const arrestedChecklistContainer = document.getElementById('arrested-checklist-container');
            if(arrestedChecklistContainer) {
                arrestedChecklistContainer.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6 h-full">
                        <h4 class="text-xl font-bold text-red-800 mb-4 text-center">Checklist: Rights of the Arrested</h4>
                        <ul class="space-y-2">
                            ${appData.actionChecklists.arrested.map(right => `<li class="flex items-start"><i data-lucide="check-circle" class="text-red-600 mr-2 w-5 h-5 flex-shrink-0 mt-1"></i><span class="text-red-800">${right}</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            const docsContainer = document.getElementById('documents-accordion');
            if(docsContainer) {
                docsContainer.innerHTML = appData.keyDocuments.map((doc, index) => `
                    <div class="border border-slate-200 rounded-lg bg-white shadow-sm animate-on-scroll" style="--delay: ${index * 100}ms;">
                        <button class="accordion-toggle w-full flex justify-between items-center p-5 text-left font-semibold text-slate-800 hover:bg-slate-50">
                            <span>${doc.title}</span>
                            <span class="transform transition-transform duration-300"><i data-lucide="chevron-down" class="h-5 w-5"></i></span>
                        </button>
                        <div class="accordion-content px-5 pb-5 text-slate-600"><p>${doc.content}</p></div>
                    </div>
                `).join('');
                addAccordionListener(docsContainer);
            }
            lucide.createIcons();
        }

        function initProtections() {
            const tabsContainer = document.getElementById('protections-tabs');
            const contentContainer = document.getElementById('protections-content');
            if (!tabsContainer || !contentContainer) return;

            tabsContainer.innerHTML = appData.protections.map((tab, index) => `
                <button class="protection-tab whitespace-nowrap flex items-center py-4 px-3 border-b-2 font-medium text-sm ${index === 0 ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}" data-target="${tab.id}">
                    <span class="mr-2 text-lg">${tab.icon}</span>${tab.title}
                </button>
            `).join('');

            function renderProtectionContent(id) {
                const protectionData = appData.protections.find(p => p.id === id);
                contentContainer.innerHTML = `<div class="space-y-4 pt-6">${protectionData.content.map(item => `<div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm"><h4 class="font-semibold text-slate-800">${item.title}</h4><div class="text-slate-600 mt-1">${item.text}</div></div>`).join('')}</div>`;
            }

            tabsContainer.querySelectorAll('.protection-tab').forEach(button => {
                button.addEventListener('click', () => {
                    tabsContainer.querySelectorAll('.protection-tab').forEach(btn => {
                        btn.classList.remove('border-accent', 'text-accent');
                        btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                    });
                    button.classList.add('border-accent', 'text-accent');
                    button.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                    renderProtectionContent(button.dataset.target);
                });
            });
            renderProtectionContent(appData.protections[0].id);
        }

        function initResources() {
            const tabsContainer = document.getElementById('resources-tabs');
            const contentContainer = document.getElementById('resources-content');
            if (!tabsContainer || !contentContainer) return;
            const tabs = tabsContainer.querySelectorAll('.resource-tab');

            const renderTemplates = () => `
                <div class="space-y-4 pt-6">${appData.documentTemplates.map((template) => `<div class="bg-white rounded-lg border border-slate-200 shadow-sm"><div class="p-4"><h4 class="font-semibold text-slate-800">${template.title}</h4><p class="text-slate-600 mt-1 text-sm">${template.description}</p></div><pre class="bg-slate-50 p-4 whitespace-pre-wrap font-mono text-xs border-t border-slate-200">${template.template}</pre><div class="p-4 border-t border-slate-200 text-right"><button class="copy-template-btn bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm hover:bg-slate-300" data-template="${template.template}">Copy Template</button><span class="copy-feedback text-sm text-green-600 ml-2"></span></div></div>`).join('')}<p class="text-xs text-red-600 mt-4 text-center"><strong>Disclaimer:</strong> These templates are for basic guidance ONLY and are not a substitute for legal advice.</p></div>`;
            const renderCases = () => `<div class="space-y-4 pt-6">${appData.caseStudies.map(study => `<div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"><h4 class="font-semibold text-slate-800">${study.title}</h4><p class="text-xs text-slate-500">${study.citation}</p><p class="text-slate-600 mt-2">${study.summary}</p><div class="mt-3 pt-3 border-t border-slate-200"><p class="text-sm font-semibold text-blue-800">Key Principle:</p><p class="text-sm text-slate-700">${study.keyPrinciple}</p></div></div>`).join('')}</div>`;
            const renderAITools = () => `
                <div class="pt-6 space-y-4">
                    <div class="bg-white p-8 rounded-lg shadow-md border border-slate-200">
                        <h3 class="text-xl font-bold mb-3">AI Document Drafter</h3>
                        <p class="text-sm text-slate-600 mb-4">Generate structured legal documents quickly. Provide the requested information and download a polished PDF ready for submission.</p>
                        <form id="doc-drafter-form" class="space-y-4">
                            <div>
                                <label for="doc-type" class="block text-sm font-medium text-slate-700">Select Document Type</label>
                                <select id="doc-type" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md shadow-sm">
                                    <option value="RTI Application">RTI Application</option>
                                    <option value="Complaint Letter">Complaint Letter</option>
                                    <option value="General Affidavit">General Affidavit</option>
                                </select>
                            </div>
                            <div id="drafter-fields" class="space-y-4"></div>
                            <div class="flex flex-col sm:flex-row gap-3">
                                <button type="button" id="preview-doc-btn" class="w-full sm:w-auto bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 transition-colors">
                                    Preview PDF
                                </button>
                                <button type="submit" id="generate-doc-btn" class="w-full sm:w-auto bg-accent text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                                    Generate &amp; Download PDF
                                </button>
                            </div>
                        </form>
                    </div>
                    <p class="text-xs text-red-600 text-center"><strong>Disclaimer:</strong> AI outputs are for informational purposes only and do not replace professional legal advice.</p>
                </div>`;

            const renderers = {
                templates: renderTemplates,
                cases: renderCases,
                'ai-tools': renderAITools,
            };

            const renderContent = (target) => {
                const renderer = renderers[target] || renderers.templates;
                contentContainer.innerHTML = renderer();
                if (target === 'templates') addCopyListeners();
                if (target === 'ai-tools') setupDrafter();
            };

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    renderContent(tab.dataset.target);
                });
            });

            // Default to AI Tools so the Document Drafter (with Preview button) is visible immediately
            const defaultTab = Array.from(tabs).find(t => t.dataset.target === 'ai-tools') || tabs[0];
            defaultTab.classList.add('active');
            renderContent(defaultTab.dataset.target);
        }

        function addCopyListeners() {
            document.querySelectorAll('.copy-template-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const templateText = e.target.dataset.template;
                    const feedback = e.target.nextElementSibling;
                    navigator.clipboard.writeText(templateText).then(() => {
                        feedback.textContent = 'Copied!';
                        setTimeout(() => feedback.textContent = '', 2000);
                    }, () => feedback.textContent = 'Copy failed.');
                });
            });
        }

        function initHelp() {
            const container = document.getElementById('help-grid');
            if(container) {
                container.innerHTML = appData.help.map((item, index) => `
                    <div class="bg-white rounded-lg shadow-md p-6 border border-slate-200 flex flex-col text-center items-center group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll" style="--delay: ${index * 100}ms;">
                        <div class="bg-blue-100 text-accent rounded-full p-3 mb-4"><i data-lucide="${getIconForHelp(item.title)}" class="w-8 h-8"></i></div>
                        <h3 class="text-xl font-bold text-slate-900 mb-2">${item.title}</h3>
                        <p class="text-slate-600 flex-grow mb-4">${item.content}</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="inline-block bg-accent text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">${item.action}</a>
                    </div>`).join('');
            }

            const helplineContainer = document.getElementById('helpline-directory');
            if(helplineContainer) {
                helplineContainer.innerHTML = `
                    <h3 class="text-2xl font-bold text-slate-800 mb-6 text-center font-heading">National Helpline Directory</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${appData.helplines.map(line => `<div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"><h4 class="font-semibold text-slate-800">${line.name}</h4><p class="text-2xl font-bold text-accent my-2">${line.number}</p><p class="text-sm text-slate-600">${line.description}</p></div>`).join('')}</div>`;
            }
            lucide.createIcons();
        }

        function getIconForHelp(title) {
            const mapping = {'Cyber Crime Portal': 'shield', 'National Commission for Women': 'user', 'National Commission for Protection of Child Rights': 'baby', 'National Consumer Helpline': 'shopping-cart', 'Right to Information (RTI)': 'file-search', 'Free Legal Aid (NALSA)': 'scale', 'State Police Services': 'building', 'Human Rights Commissions': 'users'};
            return mapping[title] || 'help-circle';
        }
        
        function getBadgeIcon(badgeName) {
            const iconMapping = {
                'Bronze Scholar': 'award',
                'Silver Navigator': 'compass',
                'Gold Expert': 'star',
                'Platinum Master': 'shield',
                'Basic Rights Badge': 'bookmark',
                // Add more mappings as needed
            };
            return iconMapping[badgeName] || 'award'; // Default to award icon if no mapping exists
        }

        // Handles accordion open/close functionality
        function addAccordionListener(container) {
            container.querySelectorAll('.accordion-toggle').forEach(button => {
                button.addEventListener('click', () => {
                    const content = button.nextElementSibling;
                    const icon = button.querySelector('i[data-lucide]');
                    const wasOpen = content.style.maxHeight;
                    container.querySelectorAll('.accordion-content').forEach(c => c.style.maxHeight = null);
                    container.querySelectorAll('.accordion-toggle i[data-lucide]').forEach(i => i.style.transform = 'rotate(0deg)');
                    if (!wasOpen) {
                        content.style.maxHeight = content.scrollHeight + "px";
                        if (icon) icon.style.transform = 'rotate(180deg)';
                    }
                });
            });
        }

        // Sets up on-scroll animations for elements
        function initScrollAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        }

        // --- SAFE INITIALIZATION CALLS ---
        try { initRights(); } catch (e) { console.error("Failed to initialize Rights Section:", e); }
        try { initCrimes(); } catch (e) { console.error("Failed to initialize Crimes Section:", e); }
        try { initActionPlan(); } catch (e) { console.error("Failed to initialize Action Plan Section:", e); }
        try { initProtections(); } catch (e) { console.error("Failed to initialize Protections Section:", e); }
    try { initResources(); } catch (e) { console.error("Failed to initialize Resources Section:", e); }
    try { initHelp(); } catch (e) { console.error("Failed to initialize Help Section:", e); }
    try { initLearningSpace(); } catch (e) { console.error("Failed to initialize Learning Space:", e); }
    try { initScrollAnimations(); } catch (e) { console.error("Failed to initialize Scroll Animations:", e); }

        navigateTo(window.location.hash || '#home');
    }

    // --- NYAYAI CHATBOT INITIALIZATION ---
    function initNyayAIChatbot() {
        const chatBubble = document.getElementById('chat-bubble');
        const chatWindow = document.getElementById('chat-window');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const fileBtn = document.getElementById('chat-attach-btn');
        const fileInput = document.getElementById('chat-file-upload');
        const filePreview = document.getElementById('chat-file-preview-container');
        const fileNameEl = document.getElementById('chat-file-preview-name');
        const removeFileBtn = document.getElementById('chat-remove-file-btn');

        let attachedFile = null;

        function toggleChatWindow() {
            if (!chatWindow || !chatBubble) return;
            const isOpen = !chatWindow.classList.contains('hidden');

            if (isOpen) {
                chatWindow.classList.add('md:scale-95', 'md:opacity-0');
                chatWindow.classList.remove('md:scale-100', 'md:opacity-100');
                setTimeout(() => {
                    chatWindow.classList.add('hidden');
                    chatBubble.classList.remove('hidden');
                }, 300);
            } else {
                if (chatMessages.children.length === 0) {
                    const welcomeMessage = `
                        <div class="chat-message bot">
                            <div class="chat-bubble">
                                <div class="prose">
                                    <p>Welcome to NyayAI! I can help you understand Indian law.</p>
                                    <p class="chat-disclaimer">
                                        <strong>Disclaimer:</strong> This information is for general knowledge only and not a substitute for professional legal advice.
                                    </p>
                                </div>
                            </div>
                        </div>`;
                    chatMessages.innerHTML = welcomeMessage;
                }
                chatWindow.classList.remove('hidden');
                setTimeout(() => {
                    chatWindow.classList.add('md:scale-100', 'md:opacity-100');
                    chatWindow.classList.remove('md:scale-95', 'md:opacity-0');
                    chatBubble.classList.add('hidden');
                }, 10);
            }
        }

        if (chatBubble) chatBubble.addEventListener('click', toggleChatWindow);
        if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChatWindow);

        async function sendMessage() {
            const messageText = chatInput.value.trim();
            if (!messageText && !attachedFile) return;

            if (messageText) appendMessage(messageText, 'user');
            if (attachedFile) appendMessage(`<em>Analyzing file: ${attachedFile.name}</em>`, 'user', true);

            chatInput.value = '';
            const userMessageData = messageText;
            const userFile = attachedFile;
            removeAttachedFile();

            const loadingIndicator = appendMessage('<div class="typing-indicator"><span></span><span></span><span></span></div>', 'bot', true);
            scrollToBottom();

            try {
                // Always use FormData, even for text-only
                const formData = new FormData();
                formData.append('query', userMessageData);
                if (userFile) formData.append('document', userFile);

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok || !response.body) {
                    let errorText = `Server error: ${response.status} ${response.statusText}`;
                    try { errorText = await response.text(); } catch {}
                    throw new Error(errorText);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let botMessageBubble;
                let fullResponse = "";
                let firstChunk = true;

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    fullResponse += chunk;
                    
                    // Remove loading indicator on first chunk
                    if (firstChunk && loadingIndicator && loadingIndicator.parentNode) {
                        loadingIndicator.remove();
                        firstChunk = false;
                    }
                    
                    // Create message bubble if it doesn't exist
                    if (!botMessageBubble) {
                        const messageEl = appendMessage('', 'bot');
                        botMessageBubble = messageEl.querySelector('.chat-bubble .prose');
                    }
                    
                    // Update content
                    if (botMessageBubble) {
                        if (window.marked) {
                            botMessageBubble.innerHTML = marked.parse(fullResponse);
                        } else {
                            botMessageBubble.textContent = fullResponse;
                        }
                    }
                    scrollToBottom();
                }
                
                // Ensure response is displayed even if no chunks were received
                if (firstChunk && loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.remove();
                }
                if (!botMessageBubble && fullResponse) {
                    appendMessage(fullResponse, 'bot');
                } else if (fullResponse && !botMessageBubble.textContent && !botMessageBubble.innerHTML) {
                    // Fallback: create message if bubble exists but is empty
                    appendMessage(fullResponse, 'bot');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                if (loadingIndicator && loadingIndicator.parentNode) loadingIndicator.remove();
                appendMessage(`Error: ${error.message}`, 'bot');
            }
            scrollToBottom();
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (chatInput) chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        if (fileBtn) fileBtn.addEventListener('click', () => fileInput.click());
        if (fileInput) fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                attachedFile = file;
                fileNameEl.textContent = file.name;
                filePreview.classList.remove('hidden');
                filePreview.classList.add('flex');
            }
        });

        if (removeFileBtn) removeFileBtn.addEventListener('click', removeAttachedFile);

        function removeAttachedFile() {
            attachedFile = null;
            if (fileInput) fileInput.value = '';
            if (filePreview) {
                filePreview.classList.add('hidden');
                filePreview.classList.remove('flex');
            }
        }

        function appendMessage(content, sender, isHtml = false) {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `chat-message ${sender}`;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            const prose = document.createElement('div');
            prose.className = 'prose max-w-none';
            if (isHtml) prose.innerHTML = content;
            else prose.textContent = content;
            bubble.appendChild(prose);
            messageWrapper.appendChild(bubble);
            chatMessages.appendChild(messageWrapper);
            scrollToBottom();
            return messageWrapper;
        }

        function scrollToBottom() {
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // --- Document Generation & Scanner Logic ---
    
    function createFormField(label, name, type = 'text', required = true) {
        const req = required ? 'required' : '';
        if (type === 'textarea') {
            return `<div><label class="block text-sm font-medium text-slate-700">${label}</label><textarea name="${name}" ${req} class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent" rows="4"></textarea></div>`;
        }
        return `<div><label class="block text-sm font-medium text-slate-700">${label}</label><input type="${type}" name="${name}" ${req} class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent"></div>`;
    }

    function setupDrafter() {
        const docTypeSelect = document.getElementById('doc-type');
        const fieldsContainer = document.getElementById('drafter-fields');
        const form = document.getElementById('doc-drafter-form');
        const previewBtn = document.getElementById('preview-doc-btn');
        const generateBtn = document.getElementById('generate-doc-btn');

        const fields = {
            'RTI Application': [
                createFormField("Applicant's Name", 'applicantName'),
                createFormField("Applicant's Address", 'applicantAddress'),
                createFormField("Mobile Number", 'mobile'),
                createFormField("Public Authority (Office Name/Address)", 'department'),
                createFormField("Information Required (Be specific)", 'information', 'textarea'),
            ],
            'Complaint Letter': [
                createFormField("Your Name", 'complainantName'),
                createFormField("Your Address", 'complainantAddress'),
                createFormField("Mobile Number", 'mobile'),
                createFormField("Authority/Department to Complain To", 'authority'),
                createFormField("Subject of Complaint", 'issue'),
                createFormField("Detailed Complaint", 'details', 'textarea'),
                createFormField("Action/Relief Requested", 'relief', 'textarea'),
            ],
            'General Affidavit': [
                createFormField("Deponent's Name (Your Name)", 'deponentName'),
                createFormField("Father's Name", 'fatherName'),
                createFormField("Address", 'address'),
                createFormField("Statement(s) to be affirmed", 'statements', 'textarea'),
                createFormField("Purpose of the Affidavit", 'purpose'),
            ]
        };

        const updateFields = () => {
            fieldsContainer.innerHTML = fields[docTypeSelect.value].join('');
        };
        
        docTypeSelect.addEventListener('change', updateFields);
        updateFields(); // Initial call

        // Handle Preview click: generate, show modal viewer
        previewBtn.addEventListener('click', async () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.type = docTypeSelect.value;

            previewBtn.disabled = true;
            previewBtn.textContent = 'Generating preview...';

            try {
                showNotification(`Generating ${data.type} preview...`, 'info');
                const response = await fetch('/api/generate-doc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Preview generation failed');
                const result = await response.json();
                if (!result.success) throw new Error(result.error || 'Preview generation failed');

                // Modal with PDF.js viewer
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
                modal.id = 'document-preview-modal';
                const absolutePreview = new URL(result.previewUrl, window.location.origin).toString();
                const encodedPreview = encodeURIComponent(absolutePreview);
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div class="flex justify-between items-center border-b border-slate-200 p-4">
                            <h3 class="font-bold text-lg">${data.type} Preview</h3>
                            <button class="text-slate-500 hover:text-slate-700" id="close-preview">✕</button>
                        </div>
                        <div class="flex-1 p-1 overflow-auto bg-slate-100">
                            <iframe src="/pdf-viewer.html?file=${encodedPreview}" class="w-full h-full border-0 bg-white" id="pdf-preview-frame"></iframe>
                        </div>
                        <div class="p-2 text-center text-sm text-slate-500">
                            If the preview doesn't load, <a href="${result.previewUrl}" target="_blank" class="text-blue-500 underline">open the PDF directly</a>
                        </div>
                        <div class="border-t border-slate-200 p-4 flex justify-between items-center space-x-4">
                            <a href="${result.previewUrl}" target="_blank" class="text-sm text-blue-600 underline">Open raw PDF</a>
                            <a href="${result.downloadUrl}" class="bg-accent text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium" target="_blank">Download PDF</a>
                        </div>
                    </div>`;
                const existing = document.getElementById('document-preview-modal');
                if (existing) existing.remove();
                document.body.appendChild(modal);
                document.getElementById('close-preview').addEventListener('click', () => modal.remove());
                showNotification(`${data.type} preview ready.`, 'success');
            } catch (err) {
                console.error(err);
                showNotification('Error: Could not generate preview.', 'error');
            } finally {
                previewBtn.disabled = false;
                previewBtn.textContent = 'Preview PDF';
            }
        });

        // Handle Generate (download) on form submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.type = docTypeSelect.value;
            
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';

            try {
                // Show generation in progress notification
                showNotification(`Generating ${data.type}... Please wait.`, 'info');
                
                console.log('📄 Sending document generation request:', data);
                
                const response = await fetch('/api/generate-doc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                console.log('📄 Document generation response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Document generation failed with status:', response.status, errorText);
                    throw new Error(`Failed to generate document. Server returned: ${response.status}`);
                }
                
                const result = await response.json();
                console.log('📄 Document generation result:', result);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to generate document.');
                }
                
                // Create a modal for document preview
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
                modal.id = 'document-preview-modal';
                const absolutePreview = new URL(result.previewUrl, window.location.origin).toString();
                const encodedPreview = encodeURIComponent(absolutePreview);
                modal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div class="flex justify-between items-center border-b border-slate-200 p-4">
                            <h3 class="font-bold text-lg">${data.type} Preview</h3>
                            <button class="text-slate-500 hover:text-slate-700" id="close-preview">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="flex-1 p-1 overflow-auto bg-slate-100">
                            <iframe src="/pdf-viewer.html?file=${encodedPreview}" class="w-full h-full border-0 bg-white" id="pdf-preview-frame"></iframe>
                        </div>
                        <div class="p-2 text-center text-sm text-slate-500">
                            If the preview doesn't load, <a href="${result.previewUrl}" target="_blank" class="text-blue-500 underline">open the PDF directly</a>
                        </div>
                        <div class="border-t border-slate-200 p-4 flex justify-between items-center space-x-4">
                            <a href="${result.previewUrl}" target="_blank" class="text-sm text-blue-600 underline">Open raw PDF</a>
                            <a href="${result.downloadUrl}" class="bg-accent text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium" target="_blank">
                                Download PDF
                            </a>
                        </div>
                    </div>
                `;
                
                // Remove any existing modal
                const existingModal = document.getElementById('document-preview-modal');
                if (existingModal) {
                    document.body.removeChild(existingModal);
                }
                
                document.body.appendChild(modal);
                
                // Add event listener to close modal
                document.getElementById('close-preview').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                showNotification(`${data.type} generated successfully! You can preview and download it.`, 'success');
                
            } catch (error) {
                console.error('Document generation failed:', error);
                showNotification('Error: Could not generate document.', 'error');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate & Download PDF';
            }
        });
    }

    function showNotification(message, type = 'info') {
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            error: 'bg-red-500'
        };
        const notification = document.createElement('div');
        notification.className = `notification fixed top-5 right-5 ${colors[type]} text-white py-2 px-4 rounded-lg shadow-md`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Initialize all components
    try {
        initializeWebsite();
        initNyayAIChatbot();
    } catch(e) {
        console.error("Failed to initialize:", e);
    }
});

// Badge icon mapping function
function getBadgeIcon(badgeName) {
    const iconMap = {
        'Bronze Scholar': 'medal',
        'Silver Navigator': 'compass',
        'Gold Expert': 'crown',
        'Platinum Master': 'star',
        'Legal Expert': 'graduation-cap',
        'Rights Champion': 'shield',
        'Justice Warrior': 'sword',
        'Constitutional Scholar': 'book',
        'Law Master': 'scale'
    };
    return iconMap[badgeName] || 'award';
}

// --- Learning Space ---
function initLearningSpace() {
    console.log('Initializing Learning Space...');
    if (typeof quizData === 'undefined' || !quizData.modules) {
        console.warn('quizData not found; ensure quiz_data.js is loaded before app.js');
        console.log('Available global variables:', Object.keys(window));
        return;
    }
    console.log('Quiz data loaded successfully, modules:', quizData.modules.length);

    // DOM
    const moduleSelection = document.getElementById('module-selection');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const dashboard = document.getElementById('progress-dashboard');
    const quizTitle = document.getElementById('quiz-title');
    const quizSubtitle = document.getElementById('quiz-subtitle');
    const progressBar = document.getElementById('quiz-progress');
    const questionContainer = document.getElementById('question-container');
    const nextBtn = document.getElementById('next-question');
    const quitBtn = document.getElementById('quit-quiz');
    const finalScoreEl = document.getElementById('final-score');
    const badgesEarnedEl = document.getElementById('badges-earned');
    const retryLevelBtn = document.getElementById('retry-level');
    const nextLevelBtn = document.getElementById('next-level');
    const backToModulesBtn = document.getElementById('back-to-modules');
    const downloadCertBtn = document.getElementById('download-certificate');

    if (!moduleSelection || !quizScreen || !resultsScreen) return;

    const PASS_THRESHOLD = 0.7;

    // Progress
    function loadProgress() {
        try {
            return JSON.parse(localStorage.getItem('nyay_learning_progress')) || {
                unlockedModules: { 'constitution-rights': true },
                completedLevels: {}, // key: `${moduleId}:${levelId}` -> true
                scores: {}, // key: `${moduleId}:${levelId}` -> number (0..1)
                badgesEarned: {}, // key: moduleId -> [badges]
            };
        } catch { return { unlockedModules: { 'constitution-rights': true }, completedLevels: {}, scores: {}, badgesEarned: {} }; }
    }
    function saveProgress(p) { localStorage.setItem('nyay_learning_progress', JSON.stringify(p)); }

    let progress = loadProgress();

    // Rendering
    function renderModules() {
        renderDashboard();
        moduleSelection.innerHTML = quizData.modules.map(mod => {
            const unlocked = !!progress.unlockedModules[mod.id];
            const completedCount = (mod.levels || []).filter(l => progress.completedLevels[`${mod.id}:${l.id}`]).length;
            const total = (mod.levels || []).length;
            return `
                <div class="bg-white rounded-lg shadow-md border border-slate-200 p-6 ${unlocked ? '' : 'opacity-60'}">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-xl font-bold text-slate-900">${mod.title}</h3>
                            <p class="text-sm text-slate-600 mt-1">${mod.description}</p>
                            <div class="mt-2 text-sm text-slate-500">Progress: ${completedCount}/${total} levels</div>
                            <div class="mt-3 flex flex-wrap gap-2">
                                ${(mod.levels||[]).map((lvl, idx) => {
                                    const key = `${mod.id}:${lvl.id}`;
                                    const done = !!progress.completedLevels[key];
                                    return `<button class="btn-secondary" data-mod="${mod.id}" data-level="${idx}" ${!unlocked ? 'disabled' : ''}>${lvl.title} ${done ? '✓' : ''}</button>`;
                                }).join('')}
                            </div>
                        </div>
                        ${mod.badge ? `<div class="badge badge-module"><i data-lucide="${getBadgeIcon(mod.badge)}" class="badge-icon"></i>${mod.badge}</div>` : ''}
                    </div>
                </div>`;
        }).join('');

        moduleSelection.querySelectorAll('button[data-mod]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modId = btn.getAttribute('data-mod');
                const levelIndex = parseInt(btn.getAttribute('data-level'), 10);
                startQuiz(modId, levelIndex);
            });
        });
        
        // Initialize Lucide icons for badges
        lucide.createIcons();
    }

    function startQuiz(moduleId, levelIndex) {
        const mod = quizData.modules.find(m => m.id === moduleId);
        if (!mod) return;
        const level = mod.levels[levelIndex];
        if (!level) return;

        moduleSelection.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');

        quizTitle.textContent = mod.title;
        quizSubtitle.textContent = level.title;

        const questions = level.questions.slice();
        let current = 0;
        let correct = 0;
        renderQuestion();

        quitBtn.onclick = () => {
            quizScreen.classList.add('hidden');
            resultsScreen.classList.add('hidden');
            moduleSelection.classList.remove('hidden');
        };

        nextBtn.onclick = () => {
            current++;
            if (current < questions.length) {
                renderQuestion();
            } else {
                finishQuiz();
            }
        };

        function renderQuestion() {
            nextBtn.classList.add('hidden');
            const q = questions[current];
            const progressPct = Math.round((current / questions.length) * 100);
            progressBar.style.width = progressPct + '%';
            questionContainer.innerHTML = `
                <div class="text-lg font-semibold text-slate-900">${q.question}</div>
                <div class="mt-3">
                    ${q.options.map((opt, idx) => `<button class="quiz-option" data-idx="${idx}">${opt}</button>`).join('')}
                </div>
                <div class="quiz-explanation hidden" id="q-expl"></div>
            `;

            questionContainer.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Prevent multiple answers
                    if (questionContainer.classList.contains('answered')) return;
                    questionContainer.classList.add('answered');

                    const idx = parseInt(btn.getAttribute('data-idx'), 10);
                    const isCorrect = idx === q.correctIndex;
                    if (isCorrect) correct++;

                    // Visual feedback
                    questionContainer.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
                    btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                    const correctBtn = questionContainer.querySelector(`.quiz-option[data-idx="${q.correctIndex}"]`);
                    if (correctBtn) correctBtn.classList.add('correct');

                    const explEl = document.getElementById('q-expl');
                    explEl.textContent = q.explanation;
                    explEl.classList.remove('hidden');
                    nextBtn.classList.remove('hidden');
                });
            });
        }

        function finishQuiz() {
            progressBar.style.width = '100%';
            quizScreen.classList.add('hidden');
            resultsScreen.classList.remove('hidden');
            const score = correct / questions.length;
            finalScoreEl.textContent = `Score: ${correct}/${questions.length} (${Math.round(score*100)}%)`;

            // Save progress
            const key = `${moduleId}:${level.id}`;
            if (!progress.scores[key] || score > progress.scores[key]) {
                progress.scores[key] = score;
            }
            if (score >= PASS_THRESHOLD) {
                progress.completedLevels[key] = true;
                // Unlock next level
                const nextIdx = levelIndex + 1;
                if (mod.levels[nextIdx]) {
                    // nothing specific needed; level buttons always visible in UI
                } else {
                    // Completed module -> badge
                    progress.badgesEarned[mod.id] = progress.badgesEarned[mod.id] || [];
                    if (!progress.badgesEarned[mod.id].includes(mod.badge)) {
                        progress.badgesEarned[mod.id].push(mod.badge);
                    }
                    downloadCertBtn.classList.remove('hidden');
                }
            }
            saveProgress(progress);
            renderDashboard();

            // Show badges
            badgesEarnedEl.innerHTML = '';
            const badges = progress.badgesEarned[mod.id] || [];
            if (badges.length) {
                badgesEarnedEl.innerHTML = badges.map(b => `<span class="badge badge-earned animate-badge"><i data-lucide="${getBadgeIcon(b)}" class="badge-icon"></i>${b}</span>`).join(' ');
                // Initialize the Lucide icons in the newly added badges
                lucide.createIcons({
                    attrs: {
                        class: ["badge-icon"]
                    }
                });
            }

            retryLevelBtn.onclick = () => startQuiz(moduleId, levelIndex);
            nextLevelBtn.onclick = () => {
                const nextIdx = levelIndex + 1;
                if (mod.levels[nextIdx]) startQuiz(moduleId, nextIdx); else {
                    // Back to modules if no next
                    resultsScreen.classList.add('hidden');
                    moduleSelection.classList.remove('hidden');
                    renderModules();
                }
            };
            backToModulesBtn.onclick = () => {
                resultsScreen.classList.add('hidden');
                moduleSelection.classList.remove('hidden');
                renderModules();
            };
            downloadCertBtn.onclick = () => generateCertificate(mod.title);
        }
    }

    function renderDashboard() {
        if (!dashboard) return;
        const totalModules = quizData.modules.length;
        const completedModules = quizData.modules.filter(m => (m.levels||[]).every(l => progress.completedLevels[`${m.id}:${l.id}`])).length;
        
        // Fix badge collection by ensuring it's an array of strings
        let allBadges = [];
        Object.keys(progress.badgesEarned).forEach(modId => {
            const badges = progress.badgesEarned[modId] || [];
            if (Array.isArray(badges)) {
                allBadges = allBadges.concat(badges);
            }
        });
        
        const bestScores = Object.entries(progress.scores).map(([k,v]) => ({ key:k, score: Math.round(v*100) }));

        dashboard.innerHTML = `
            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div class="text-sm text-slate-500">Modules Completed</div>
                        <div class="text-2xl font-bold text-slate-900">${completedModules}/${totalModules}</div>
                    </div>
                    <div>
                        <div class="text-sm text-slate-500">Badges</div>
                        <div class="badges-container">${allBadges.length ? allBadges.map(b => `<span class="badge"><i data-lucide="${getBadgeIcon(b)}" class="badge-icon"></i>${b}</span>`).join(' ') : '—'}</div>
                    </div>
                    <div class="w-64">
                        <div class="text-sm text-slate-500 mb-1">Overall Progress</div>
                        <div class="progress"><div class="progress-bar" style="width:${Math.round((Object.keys(progress.completedLevels).length/ (quizData.modules.reduce((acc,m)=>acc+(m.levels?m.levels.length:0),0)||1))*100)}%"></div></div>
                    </div>
                </div>
                ${bestScores.length ? `<div class="mt-4 text-sm text-slate-600">Best Scores: ${bestScores.slice(0,5).map(s=>`${s.key.split(':')[1]} ${s.score}%`).join(' | ')}</div>` : ''}
            </div>`;
        
        // Initialize Lucide icons for badges in dashboard
        lucide.createIcons();
    }

    function generateCertificate(moduleTitle) {
        const name = 'Learner';
        const date = new Date().toLocaleDateString('en-IN');
        const cert = document.createElement('div');
        cert.className = 'certificate';
        cert.innerHTML = `
            <h2>Certificate of Achievement</h2>
            <p>This certifies that</p>
            <h3 style="font-size:1.5rem;margin:0.5rem 0;">${name}</h3>
            <p>has successfully completed the module</p>
            <h3 style="font-size:1.25rem;margin:0.5rem 0;">${moduleTitle}</h3>
            <p>on ${date}</p>
            <div class="sign-line"><div>Instructor</div><div>Learner</div></div>
        `;
        const wrap = document.createElement('div');
        wrap.style.background = '#f8fafc';
        wrap.style.padding = '20px';
        wrap.appendChild(cert);
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write('<html><head><title>Certificate</title><link rel="stylesheet" href="/style.css"></head><body></body></html>');
        w.document.body.appendChild(wrap);
        w.document.close();
        w.focus();
        w.print();
    }

    // Initial render
    renderModules();
}