-- Insert muscle to exercise area relationships
-- Exercise area IDs:
-- 1=Horizontal Push, 2=Vertical Push (Up), 3=Vertical Push (Down), 4=Lateral Push, 5=Legs Push
-- 6=Vertical Pull, 7=Horizontal Pull, 8=Lateral Pull, 9=Legs Pull
-- 10=Arm Stabilizers, 11=Scapular Depression, 12=Scapular Elevation, 13=Scapular Retraction
-- 14=Scapular Protraction, 15=Scapular Stabilizers, 16=Wrist Stabilizers, 17=Grip
-- 18=Core Stabilizers, 19=Core Anti-Extension, 20=Core Compression
-- 21=Core Rotation, 22=Core Anti-Rotation, 23=Core Lateral Flexion, 24=Core Anti-Lateral Flexion
-- 25=Core Extension, 26=Leg Stabilizers, 27=Foot Stabilizers

-- Anterior deltoid (1): Horizontal Push, Vertical Push (Up), Vertical Push (Down), Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 4, 'migration');

-- Lateral deltoid (2): Vertical Push (Up), Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (2, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (2, 4, 'migration');

-- Posterior deltoid (3): Lateral Push, Vertical Pull, Horizontal Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 4, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 7, 'migration');

-- Rotator cuff (4-7): Vertical Push (Up), Horizontal Pull, Arm Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 10, 'migration');

-- Pectoralis major (clavicular) (8): Horizontal Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (8, 1, 'migration');

-- Pectoralis major (sternal) (9): Horizontal Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (9, 1, 'migration');

-- Pectoralis minor (10): Horizontal Push, Vertical Push (Down), Scapular Depression
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (10, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (10, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (10, 11, 'migration');

-- Trapezius (upper) (11): Vertical Pull, Scapular Elevation
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (11, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (11, 12, 'migration');

-- Trapezius (middle) (12): Horizontal Pull, Scapular Retraction
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (12, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (12, 13, 'migration');

-- Trapezius (lower) (13): Vertical Push (Down), Vertical Pull, Scapular Depression
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 11, 'migration');

-- Latissimus dorsi (14): Vertical Pull, Horizontal Pull, Vertical Push (Down)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 3, 'migration');

-- Rhomboids (major) (15): Vertical Pull, Horizontal Pull, Scapular Retraction
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 13, 'migration');

-- Rhomboids (minor) (16): Vertical Pull, Horizontal Pull, Scapular Retraction
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 13, 'migration');

-- Serratus anterior (17): Vertical Push (Up), Vertical Push (Down), Scapular Protraction, Scapular Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 14, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 15, 'migration');

-- Teres major (18): Vertical Pull, Horizontal Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (18, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (18, 7, 'migration');

-- Biceps brachii (19): Vertical Pull, Horizontal Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (19, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (19, 7, 'migration');

-- Brachialis (20): Vertical Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (20, 6, 'migration');

-- Triceps brachii (long head) (21): Horizontal Push, Vertical Push (Up), Vertical Push (Down)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 3, 'migration');

-- Triceps brachii (lateral head) (22): Horizontal Push, Vertical Push (Up)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (22, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (22, 2, 'migration');

-- Triceps brachii (medial head) (23): Horizontal Push, Vertical Push (Up)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (23, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (23, 2, 'migration');

-- Forearm flexors (24): Vertical Pull, Horizontal Pull, Wrist Stabilizers, Grip
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 16, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 17, 'migration');

-- Wrist flexors (25): Vertical Pull, Horizontal Pull, Wrist Stabilizers, Grip
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 16, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 17, 'migration');

-- Forearm extensors (26): Vertical Pull, Horizontal Pull, Wrist Stabilizers, Grip
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 16, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 17, 'migration');

-- Wrist extensors (27): Vertical Pull, Horizontal Pull, Wrist Stabilizers, Grip
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 16, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 17, 'migration');

-- Pronators (28): Arm Stabilizers, Wrist Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (28, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (28, 16, 'migration');

-- Supinators (29): Arm Stabilizers, Wrist Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (29, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (29, 16, 'migration');

-- Sternocleidomastoid (30): Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (30, 18, 'migration');

-- Levator scapulae (31): Scapular Elevation, Scapular Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (31, 12, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (31, 15, 'migration');

-- Splenius capitis (32): Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (32, 18, 'migration');

-- Splenius cervicis (33): Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (33, 18, 'migration');

-- Rectus abdominis (34): Core Anti-Extension, Core Compression
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (34, 19, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (34, 20, 'migration');

-- External obliques (35): Core Rotation, Core Anti-Rotation, Core Lateral Flexion, Core Anti-Lateral Flexion
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 21, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 22, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 23, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 24, 'migration');

-- Internal obliques (36): Core Rotation, Core Anti-Rotation, Core Lateral Flexion, Core Anti-Lateral Flexion
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 21, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 22, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 23, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 24, 'migration');

-- Transverse abdominis (37): Core Anti-Extension, Core Anti-Rotation, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (37, 19, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (37, 22, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (37, 18, 'migration');

-- Multifidus (38): Core Anti-Extension, Core Anti-Rotation, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (38, 19, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (38, 22, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (38, 18, 'migration');

-- Quadratus lumborum (39): Core Lateral Flexion, Core Anti-Lateral Flexion, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (39, 23, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (39, 24, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (39, 18, 'migration');

-- Erector spinae (lumbar) (40): Core Extension, Core Anti-Extension, Legs Pull, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 25, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 19, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 18, 'migration');

-- Erector spinae (spinalis) (41): Core Extension, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (41, 25, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (41, 18, 'migration');

-- Erector spinae (longissimus) (42): Core Extension, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (42, 25, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (42, 18, 'migration');

-- Erector spinae (iliocostalis) (43): Core Extension, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (43, 25, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (43, 18, 'migration');

-- Gluteus maximus (44): Legs Push, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (44, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (44, 9, 'migration');

-- Gluteus medius (45): Lateral Push, Legs Push, Legs Pull, Leg Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 4, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 26, 'migration');

-- Gluteus minimus (46): Lateral Push, Legs Push, Leg Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (46, 4, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (46, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (46, 26, 'migration');

-- Tensor fasciae latae (47): Lateral Push, Legs Push, Leg Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (47, 4, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (47, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (47, 26, 'migration');

-- Quadriceps (rectus femoris) (48): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (48, 5, 'migration');

-- Quadriceps (vastus lateralis) (49): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (49, 5, 'migration');

-- Quadriceps (vastus medialis) (50): Legs Push, Leg Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (50, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (50, 26, 'migration');

-- Quadriceps (vastus intermedius) (51): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (51, 5, 'migration');

-- Hamstrings (biceps femoris) (52): Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (52, 9, 'migration');

-- Hamstrings (semitendinosus) (53): Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (53, 9, 'migration');

-- Hamstrings (semimembranosus) (54): Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (54, 9, 'migration');

-- Adductors (adductor longus) (55): Lateral Pull, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (55, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (55, 9, 'migration');

-- Adductors (adductor brevis) (56): Lateral Pull, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (56, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (56, 9, 'migration');

-- Adductors (adductor magnus) (57): Lateral Pull, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (57, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (57, 9, 'migration');

-- Adductors (gracilis) (58): Lateral Pull, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (58, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (58, 9, 'migration');

-- Adductors (pectineus) (59): Lateral Pull, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (59, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (59, 9, 'migration');

-- Hip flexors (iliopsoas) (60): Legs Pull, Core Compression, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (60, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (60, 20, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (60, 18, 'migration');

-- Hip flexors (sartorius) (61): Legs Pull, Core Compression, Core Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (61, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (61, 20, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (61, 18, 'migration');

-- Calves (gastrocnemius) (62): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (62, 5, 'migration');

-- Calves (soleus) (63): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (63, 5, 'migration');

-- Tibialis anterior (64): Foot Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (64, 27, 'migration');

-- Tibialis posterior (65): Foot Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (65, 27, 'migration');

-- Peroneal longus (66): Foot Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (66, 27, 'migration');

-- Peroneus brevis (67): Foot Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (67, 27, 'migration');

-- Peroneus tertius (68): Foot Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (68, 27, 'migration');

-- Popliteus (69): Leg Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (69, 26, 'migration');

