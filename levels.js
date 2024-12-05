export const LEVELS = [
    {
        id: 1,
        name: "Huấn Luyện",
        message: "Bắt đầu huấn luyện!",
        waves: [
            {
                pattern: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1]
                ]
            },
            {
                pattern: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]
            }
        ]
    },
    {
        id: 2,
        name: "Gà Bom",
        message: "Cẩn thận gà thả bom!",
        waves: [
            {
                pattern: [
                    [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
                    [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
                    [2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
                ]
            },
            {
                pattern: [
                    [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
                    [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
                    [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
                ]
            },
            {
                pattern: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ]
            }
        ]
    },
    {
        id: 3,
        name: "Gà Giáp",
        message: "Gà giáp đang đến!",
        waves: [
            {
                pattern: [
                    [2, 3, 2, 3, 2, 3],
                    [1, 3, 1, 3, 1, 3]
                ]
            },
            {
                pattern: [
                    [3, 2, 3, 2, 3, 2],
                    [2, 3, 2, 3, 2, 3]
                ]
            }
        ]
    },
    {
        id: 4,
        name: "Kamikaze Attack",
        message: "Beware of kamikaze chickens!",
        waves: [
            {
                pattern: [
                    [4, 1, 4, 1, 4, 1],
                    [1, 4, 1, 4, 1, 4]
                ]
            },
            {
                pattern: [
                    [4, 2, 4, 2, 4, 2],
                    [2, 4, 2, 4, 2, 4]
                ]
            }
        ]
    },
    {
        id: 5,
        name: "Mixed Forces",
        message: "Multiple chicken types!",
        waves: [
            {
                pattern: [
                    [1, 2, 3, 1, 2, 3],
                    [3, 2, 1, 3, 2, 1]
                ]
            },
            {
                pattern: [
                    [2, 3, 4, 2, 3, 4],
                    [4, 3, 2, 4, 3, 2]
                ]
            }
        ]
    },
    {
        id: 6,
        name: "Elite Guard",
        message: "Elite chickens spotted!",
        waves: [
            {
                pattern: [
                    [5, 3, 5, 3, 5, 3],
                    [3, 5, 3, 5, 3, 5],
                    [5, 3, 5, 3, 5, 3]
                ]
            },
            {
                pattern: [
                    [5, 4, 5, 4, 5, 4],
                    [4, 5, 4, 5, 4, 5],
                    [5, 4, 5, 4, 5, 4]
                ]
            },
            {
                pattern: [
                    [5, 3, 5, 3, 5, 3],
                    [3, 4, 3, 4, 3, 4],
                    [5, 3, 5, 3, 5, 3],
                    [3, 5, 3, 5, 3, 5]
                ]
            }
        ]
    },
    {
        id: 7,
        name: "Bomber Squad",
        message: "Heavy bombers approaching!",
        waves: [
            {
                pattern: [
                    [6, 2, 6],
                    [2, 6, 2]
                ]
            },
            {
                pattern: [
                    [6, 3, 6],
                    [3, 6, 3]
                ]
            }
        ]
    },
    {
        id: 8,
        name: "Laser Force",
        message: "Laser chickens detected!",
        waves: [
            {
                pattern: [
                    [7, 3, 7],
                    [3, 7, 3]
                ]
            },
            {
                pattern: [
                    [7, 4, 7],
                    [4, 7, 4]
                ]
            }
        ]
    },
    {
        id: 9,
        name: "Elite Mix",
        message: "Elite forces combined!",
        waves: [
            {
                pattern: [
                    [5, 6, 5],
                    [6, 5, 6]
                ]
            },
            {
                pattern: [
                    [6, 7, 6],
                    [7, 6, 7]
                ]
            }
        ]
    },
    {
        id: 10,
        name: "Mini Boss",
        message: "Mini boss approaching!",
        waves: [
            {
                pattern: [
                    [7, 8, 7],
                    [6, 7, 6]
                ]
            }
        ]
    },
    {
        id: 11,
        name: "Advanced Squad",
        message: "Advanced formation!",
        waves: [
            {
                pattern: [
                    [5, 6, 5, 6, 5, 6],
                    [6, 5, 6, 5, 6, 5],
                    [5, 6, 5, 6, 5, 6]
                ]
            },
            {
                pattern: [
                    [6, 5, 6, 5, 6, 5],
                    [5, 7, 5, 7, 5, 7],
                    [6, 5, 6, 5, 6, 5],
                    [5, 6, 5, 6, 5, 6]
                ]
            },
            {
                pattern: [
                    [7, 6, 7, 6, 7, 6],
                    [6, 5, 6, 5, 6, 5],
                    [5, 7, 5, 7, 5, 7]
                ]
            },
            {
                pattern: [
                    [6, 7, 6, 7, 6, 7],
                    [7, 5, 7, 5, 7, 5],
                    [5, 6, 5, 6, 5, 6],
                    [6, 7, 6, 7, 6, 7]
                ]
            },
            {
                pattern: [
                    [7, 6, 7, 6, 7, 6],
                    [6, 7, 6, 7, 6, 7],
                    [7, 6, 7, 6, 7, 6],
                    [6, 5, 6, 5, 6, 5]
                ]
            }
        ]
    },
    {
        id: 12,
        name: "Laser Storm",
        message: "Multiple laser chickens!",
        waves: [
            {
                pattern: [
                    [7, 6, 7, 6],
                    [6, 7, 6, 7],
                    [7, 6, 7, 6]
                ]
            }
        ]
    },
    {
        id: 13,
        name: "Elite Storm",
        message: "Elite chicken storm!",
        waves: [
            {
                pattern: [
                    [5, 6, 7, 6, 5],
                    [6, 7, 6, 7, 6],
                    [7, 6, 7, 6, 7]
                ]
            }
        ]
    },
    {
        id: 14,
        name: "Death Squad",
        message: "Deadly combination!",
        waves: [
            {
                pattern: [
                    [7, 6, 7, 6, 7],
                    [6, 7, 8, 7, 6],
                    [7, 6, 7, 6, 7]
                ]
            }
        ]
    },
    {
        id: 15,
        name: "Boss Rush",
        message: "Multiple bosses!",
        waves: [
            {
                pattern: [
                    [0, 8, 0, 8, 0],
                    [7, 6, 7, 6, 7]
                ]
            }
        ]
    },
    {
        id: 16,
        name: "Elite Boss",
        message: "Elite boss formation!",
        waves: [
            {
                pattern: [
                    [7, 8, 7, 8, 7],
                    [6, 7, 6, 7, 6],
                    [7, 6, 7, 6, 7]
                ]
            }
        ]
    },
    {
        id: 17,
        name: "Death March",
        message: "Ultimate challenge begins!",
        waves: [
            {
                pattern: [
                    [8, 7, 8, 7, 8],
                    [7, 6, 7, 6, 7],
                    [6, 7, 6, 7, 6]
                ]
            }
        ]
    },
    {
        id: 18,
        name: "Boss Legion",
        message: "Boss legion approaching!",
        waves: [
            {
                pattern: [
                    [8, 7, 8, 7, 8],
                    [7, 8, 7, 8, 7],
                    [8, 7, 8, 7, 8]
                ]
            }
        ]
    },
    {
        id: 19,
        name: "Final Challenge",
        message: "The ultimate test!",
        waves: [
            {
                pattern: [
                    [8, 7, 8, 7, 8, 7],
                    [7, 8, 8, 8, 8, 7],
                    [8, 7, 8, 7, 8, 7],
                    [7, 6, 7, 6, 7, 6]
                ]
            },
            {
                pattern: [
                    [8, 7, 8, 7, 8, 7],
                    [7, 8, 8, 8, 8, 7],
                    [8, 8, 8, 8, 8, 8],
                    [7, 6, 7, 6, 7, 6]
                ]
            }
        ]
    },
    {
        id: 20,
        name: "Emperor's Wrath",
        message: "Face the Emperor's full power!",
        waves: [
            {
                pattern: [
                    [7, 6, 7, 6, 7, 6],
                    [6, 5, 6, 5, 6, 5],
                    [5, 7, 5, 7, 5, 7]
                ]
            },
            {
                pattern: [
                    [8, 7, 8, 7, 8, 7],
                    [7, 6, 7, 6, 7, 6],
                    [6, 8, 6, 8, 6, 8],
                    [7, 6, 7, 6, 7, 6]
                ]
            },
            {
                pattern: [
                    [8, 7, 8, 7, 8, 7],
                    [7, 8, 7, 8, 7, 8],
                    [8, 7, 8, 7, 8, 7],
                    [7, 6, 7, 6, 7, 6]
                ]
            },
            {
                pattern: [
                    [8, 8, 8, 8, 8, 8],
                    [8, 7, 8, 7, 8, 7],
                    [7, 8, 7, 8, 7, 8],
                    [8, 7, 8, 7, 8, 7]
                ]
            },
            {
                pattern: [
                    [8, 8, 8, 8, 8, 8],
                    [8, 7, 8, 7, 8, 7],
                    [8, 8, 8, 8, 8, 8],
                    [7, 8, 7, 8, 7, 8]
                ]
            },
            {
                pattern: [
                    [8, 8, 8, 8, 8, 8],
                    [8, 8, 8, 8, 8, 8],
                    [8, 8, 8, 8, 8, 8],
                    [8, 7, 8, 7, 8, 7]
                ]
            }
        ]
    }
];

export const MESSAGES = {
    levelStart: (level) => ({
        title: `Màn ${level.id}`,
        subtitle: level.name,
        message: level.message,
        duration: 3000
    }),
    
    levelComplete: (level) => ({
        title: "Hoàn Thành!",
        subtitle: `Màn ${level.name} đã qua!`,
        message: "Chuẩn bị cho màn tiếp theo...",
        duration: 2000
    }),
    
    waveComplete: {
        title: "Hoàn Thành!",
        subtitle: "Chuẩn bị cho đợt tiếp theo...",
        message: "Gà đang đến!",
        duration: 2000
    },
    
    gameOver: {
        title: "Thua Cuộc",
        subtitle: "Trái đất đã bị xâm chiếm!",
        message: "Nhấn SPACE để chơi lại",
        duration: -1
    },
    
    gameComplete: {
        title: "Chiến Thắng!",
        subtitle: "Trái đất đã được cứu!",
        message: "Bạn đã đánh bại tất cả gà!",
        duration: 5000
    },

    // Thêm thông báo cho tên lửa
    missileLaunch: {
        title: "Kích Hoạt Tên Lửa!",
        subtitle: "Tiêu Diệt Toàn Bộ!",
        message: "Chờ 6 giây để phóng tiếp...",
        duration: 1500
    },

    missileEmpty: {
        title: "Không Đủ Tên Lửa!",
        subtitle: "Thu Thập Thêm Đùi Gà",
        message: "Cần 50 đùi gà cho 1 tên lửa",
        duration: 1000
    }
}; 